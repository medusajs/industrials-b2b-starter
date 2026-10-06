import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { HttpTypes } from "@medusajs/types"
import type { ReactNode } from "react"

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

type StripeElementsProviderProps = {
  cart: HttpTypes.StoreCart
  children: ReactNode
}

export function StripeElementsProvider({
  cart,
  children,
}: StripeElementsProviderProps) {
  const activeSession = cart?.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const isStripeSelected = activeSession?.provider_id?.startsWith("pp_stripe_")
  const clientSecret = activeSession?.data?.client_secret as string | undefined

  if (!clientSecret || !isStripeSelected) {
    return <>{children}</>
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      {children}
    </Elements>
  )
}
