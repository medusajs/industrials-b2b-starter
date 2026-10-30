import "@adyen/adyen-web/styles/adyen.css"

import { adyenClientKey, adyenEnvironment } from "@/lib/utils/adyen"
import { sdk } from "@/lib/utils/sdk"
import { toast } from "sonner"
import { useEffect, useRef, useState } from "react"

type AdyenAddCardFormProps = {
  onSuccess: () => void
  onCancel: () => void
}

// Collects a card with Adyen's Card component and saves it as one of the company's payment methods.
export function AdyenAddCardForm({ onSuccess, onCancel }: AdyenAddCardFormProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<{ submit: () => void } | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // The callbacks are registered once, so they read the latest ones from a ref.
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  useEffect(() => {
    if (!adyenClientKey || !containerRef.current) {
      return
    }

    let cancelled = false
    let unmount: (() => void) | undefined

    const mount = async () => {
      const { AdyenCheckout, Card } = await import("@adyen/adyen-web")

      const checkout = await AdyenCheckout({
        clientKey: adyenClientKey,
        environment: adyenEnvironment,
        locale: "en-US",
        countryCode: "US",
        onSubmit: async (state, _component, actions) => {
          setIsSubmitting(true)
          try {
            await sdk.client.fetch("/store/company/payment-methods", {
              method: "POST",
              body: { payment_method: state.data.paymentMethod },
            })
            actions.resolve({ resultCode: "Authorised" })
            toast.success("Card saved successfully")
            onSuccessRef.current()
          } catch (error) {
            actions.reject()
            toast.error(
              error instanceof Error ? error.message : "Failed to save card"
            )
          } finally {
            setIsSubmitting(false)
          }
        },
      })

      if (cancelled || !containerRef.current) {
        return
      }

      // Saving a card without a payment requires the cardholder's name.
      const card = new Card(checkout, {
        hasHolderName: true,
        holderNameRequired: true,
      }).mount(containerRef.current)

      cardRef.current = card
      setIsReady(true)
      unmount = () => card.unmount()
    }

    mount().catch(() => {
      toast.error("Could not load the card form")
    })

    return () => {
      cancelled = true
      unmount?.()
    }
  }, [])

  return (
    <div className="space-y-4">
      <div ref={containerRef} />
      {!adyenClientKey && (
        <p className="text-sm text-red-500">
          Adyen client key is missing. Set the VITE_ADYEN_CLIENT_KEY environment
          variable.
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => cardRef.current?.submit()}
          disabled={isSubmitting || !isReady}
          className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Card"}
        </button>
      </div>
    </div>
  )
}
