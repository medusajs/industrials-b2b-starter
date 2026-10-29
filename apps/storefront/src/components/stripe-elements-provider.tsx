import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import type { ReactNode } from "react"
import {
  getMedusaPaymentsAccount,
  isMedusaPayments,
  isStripe,
} from "@/lib/utils/checkout"
import { getStripePromiseFor } from "@/lib/utils/stripe"

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
  const clientSecret = activeSession?.data?.client_secret as string | undefined

  if (!clientSecret || !isStripe(activeSession?.provider_id)) {
    return <>{children}</>
  }

  const isMedusa = isMedusaPayments(activeSession?.provider_id)
  const stripeAccount = getMedusaPaymentsAccount(activeSession)
  const stripePromise = getStripePromiseFor({
    isMedusaPayments: isMedusa,
    stripeAccount,
  })

  return (
    <Elements
      // Elements can't switch Stripe instances, so it remounts when the account changes.
      key={`${isMedusa}:${stripeAccount ?? ""}`}
      stripe={stripePromise}
      options={{ clientSecret }}
    >
      {children}
    </Elements>
  )
}
