import { Button } from "@/components/ui/button"
import { useCompleteCartOrder } from "@/lib/hooks/use-checkout"
import { isManual, isStripe } from "@/lib/utils/checkout"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { HttpTypes } from "@medusajs/types"
import { useStripe, useElements } from "@stripe/react-stripe-js"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  className?: string
}

const PaymentButton = ({ cart, className }: PaymentButtonProps) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripe(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          cart={cart}
          notReady={notReady}
          className={className}
        />
      )
    case isManual(paymentSession?.provider_id):
      return <ManualPaymentButton notReady={notReady} className={className} />
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  className,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  className?: string
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname)
  const completeOrderMutation = useCompleteCartOrder()
  const stripe = useStripe()
  const elements = useElements()

  const activeSession = cart?.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const savedPaymentMethodId = activeSession?.data?.payment_method as string | undefined
  const clientSecret = activeSession?.data?.client_secret as string | undefined

  const handlePayment = async () => {
    if (!stripe) return

    setSubmitting(true)
    setErrorMessage(null)

    try {
      if (savedPaymentMethodId && clientSecret) {
        const { error } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: savedPaymentMethodId,
        })

        if (error) {
          setErrorMessage(error.message || "Payment failed")
          setSubmitting(false)
          return
        }
      } else {
        if (!elements) return

        const { error: submitError } = await elements.submit()
        if (submitError) {
          setErrorMessage(submitError.message || "Payment submission failed")
          setSubmitting(false)
          return
        }

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/${countryCode}/order/confirmed`,
          },
          redirect: "if_required",
        })

        if (error) {
          setErrorMessage(error.message || "Payment failed")
          setSubmitting(false)
          return
        }
      }

      const order = await completeOrderMutation.mutateAsync()

      navigate({
        to: `/${countryCode}/order/${order.id}/confirmed`,
        replace: true,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Payment failed"
      )
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady || submitting || !stripe || (!savedPaymentMethodId && !elements)}
        onClick={handlePayment}
        data-testid="place-order-button"
        className={className}
      >
        {submitting ? "Processing..." : "Place Order"}
      </Button>
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}
    </>
  )
}

const ManualPaymentButton = ({
  notReady,
  className,
}: {
  notReady: boolean
  className?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname)
  const completeOrderMutation = useCompleteCartOrder()

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const order = await completeOrderMutation.mutateAsync()

      navigate({
        to: `/${countryCode}/order/${order.id}/confirmed`,
        replace: true,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to place order"
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady || submitting}
        onClick={handlePayment}
        data-testid="place-order-button"
        className={className}
      >
        Place Order
      </Button>
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}
    </>
  )
}

export default PaymentButton
