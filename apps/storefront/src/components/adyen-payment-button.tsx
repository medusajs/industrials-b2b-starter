import "@adyen/adyen-web/styles/adyen.css"

import type {
  AdditionalDetailsActions,
  PaymentAction,
  PaymentMethodsResponse,
  ResultCode,
  SubmitActions,
} from "@adyen/adyen-web"
import { Button } from "@/components/ui/button"
import { useCompleteCartOrder } from "@/lib/hooks/use-checkout"
import { CheckoutStepKey } from "@/lib/types/global"
import { isAdyen } from "@/lib/utils/checkout"
import { adyenClientKey as clientKey, adyenEnvironment as environment } from "@/lib/utils/adyen"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { sdk } from "@/lib/utils/sdk"
import { HttpTypes } from "@medusajs/types"
import { useLocation, useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"


const DECLINED_ERROR =
  "Your payment was declined. Please try again or use a different payment method."
const GENERIC_ERROR =
  "We couldn't process your payment. Please try again or use a different payment method."

type AdyenPaymentResult =
  | { resultCode: string; action: Record<string, unknown> }
  | { error: string }

type AdyenPaymentButtonProps = {
  cart: HttpTypes.StoreCart
  notReady: boolean
  className?: string
}

// Renders Adyen's Drop-in, whose pay button places the order. The session's data holds the
// payment methods Drop-in offers: cards, Apple Pay, Google Pay, and the company's saved cards
// when the session was created with the company's account holder.
const AdyenPaymentButton = ({
  cart,
  notReady,
  className,
}: AdyenPaymentButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "us"
  const { redirectResult } = useSearch({ from: "/$countryCode/checkout" })
  const completeOrderMutation = useCompleteCartOrder()

  const session = cart.payment_collection?.payment_sessions?.find((s) =>
    isAdyen(s.provider_id)
  )

  // Passes the data that Drop-in collected to the payment session, then completes the cart.
  // Returns the action Drop-in has to handle, such as a 3D Secure challenge, or an error to show.
  const submitPayment = async (
    clientData: Record<string, unknown>
  ): Promise<AdyenPaymentResult | undefined> => {
    if (!session || !cart.payment_collection) {
      return { error: GENERIC_ERROR }
    }

    try {
      await sdk.store.payment.updatePaymentSession(
        cart.payment_collection.id,
        session.id,
        { client_data: clientData }
      )

      const order = await completeOrderMutation.mutateAsync()

      navigate({
        to: `/${countryCode}/order/${order.id}/confirmed`,
        replace: true,
      })
      return undefined
    } catch {
      const { cart: updated } = await sdk.store.cart.retrieve(cart.id, {
        // Medusa Cloud's firewall rejects a `fields` query that names `payment_collection` more than once.
        fields: "*payment_collection.payment_sessions",
      })
      const updatedSession = updated.payment_collection?.payment_sessions?.find(
        (s) => isAdyen(s.provider_id)
      )

      if (
        updatedSession?.status === "requires_more" &&
        updatedSession.data?.action
      ) {
        return {
          resultCode: updatedSession.data.result_code as string,
          action: updatedSession.data.action as Record<string, unknown>,
        }
      }

      return {
        error:
          updatedSession?.status === "error" ? DECLINED_ERROR : GENERIC_ERROR,
      }
    }
  }

  // Drop-in's callbacks are registered once, so they read the latest submit function from a ref.
  const submitPaymentRef = useRef(submitPayment)
  submitPaymentRef.current = submitPayment

  // Completes a payment the shopper's bank redirected them back from.
  useEffect(() => {
    if (!redirectResult || !session) {
      return
    }

    navigate({
      to: "/$countryCode/checkout",
      params: { countryCode },
      search: { step: CheckoutStepKey.REVIEW },
      replace: true,
    })

    submitPaymentRef.current({ details: { redirectResult } }).then((result) => {
      if (result && "error" in result) {
        setErrorMessage(result.error)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectResult, session?.id])

  useEffect(() => {
    if (!session || notReady || !clientKey || !containerRef.current) {
      return
    }

    let cancelled = false
    let unmount: (() => void) | undefined

    const handleResult = (
      result: AdyenPaymentResult | undefined,
      actions: SubmitActions | AdditionalDetailsActions
    ) => {
      if (!result) {
        return
      }

      if ("action" in result) {
        actions.resolve({
          resultCode: result.resultCode as ResultCode,
          action: result.action as unknown as PaymentAction,
        })
        return
      }

      setErrorMessage(result.error)
      actions.reject()
    }

    const mount = async () => {
      const { AdyenCheckout, Dropin, Card, ApplePay, GooglePay } =
        await import("@adyen/adyen-web")

      const checkout = await AdyenCheckout({
        clientKey,
        environment,
        locale: "en-US",
        countryCode: cart.billing_address?.country_code?.toUpperCase(),
        amount: {
          value: session.data?.amount as number,
          currency: session.data?.currency as string,
        },
        paymentMethodsResponse: session.data
          ?.payment_methods as PaymentMethodsResponse,
        onSubmit: async (state, _component, actions) => {
          setErrorMessage(null)
          handleResult(
            await submitPaymentRef.current({
              payment_method: state.data.paymentMethod,
              browser_info: state.data.browserInfo,
              store_payment_method: state.data.storePaymentMethod,
              origin: window.location.origin,
              // Used when the shopper's bank redirects them for authentication.
              return_url: `${window.location.origin}/${countryCode}/checkout?step=review`,
            }),
            actions
          )
        },
        onAdditionalDetails: async (state, _component, actions) => {
          handleResult(
            await submitPaymentRef.current({ details: state.data.details }),
            actions
          )
        },
        onError: (error) => {
          // Closing a wallet's payment sheet isn't an error worth showing.
          if (error.name !== "CANCEL") {
            setErrorMessage("Could not process the payment. Please try again.")
          }
        },
      })

      if (cancelled || !containerRef.current) {
        return
      }

      const dropin = new Dropin(checkout, {
        paymentMethodComponents: [Card, ApplePay, GooglePay],
        paymentMethodsConfiguration: {
          card: {
            hasHolderName: true,
            holderNameRequired: true,
            // Company cards are managed by company admins in the settings.
            enableStoreDetails: false,
          },
        },
      }).mount(containerRef.current)

      unmount = () => dropin.unmount()
    }

    mount().catch(() => {
      setErrorMessage("Could not load the payment methods.")
    })

    return () => {
      cancelled = true
      unmount?.()
    }
    // Drop-in is mounted once per session, so the shopper's input isn't lost when the cart refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, notReady])

  if (notReady) {
    return (
      <Button disabled className={className} data-testid="place-order-button">
        Place Order
      </Button>
    )
  }

  const error = clientKey
    ? errorMessage
    : "Adyen client key is missing. Set the VITE_ADYEN_CLIENT_KEY environment variable."

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        data-testid="place-order-button"
      />
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </>
  )
}

export default AdyenPaymentButton
