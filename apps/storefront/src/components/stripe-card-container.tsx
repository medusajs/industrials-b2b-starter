import { PaymentElement } from "@stripe/react-stripe-js"
import { getActivePaymentSession, isStripe } from "@/lib/utils/checkout"
import { HttpTypes } from "@medusajs/types"

type StripeCardContainerProps = {
  cart: HttpTypes.StoreCart
  onPaymentDetailsComplete?: (complete: boolean) => void
}

const StripeCardContainer = ({
  cart,
  onPaymentDetailsComplete,
}: StripeCardContainerProps) => {
  const activeSession = getActivePaymentSession(cart)
  const clientSecret = activeSession?.data?.client_secret as string | undefined

  if (!clientSecret || !isStripe(activeSession?.provider_id)) {
    return (
      <div className="py-4 text-sm text-zinc-500">
        Initializing payment...
      </div>
    )
  }

  return (
    <div className="my-4">
      <PaymentElement
        onChange={(e) => {
          onPaymentDetailsComplete?.(e.complete)
        }}
      />
    </div>
  )
}

export default StripeCardContainer
