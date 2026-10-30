import { loadStripe, Stripe } from "@stripe/stripe-js"

export const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
export const medusaPaymentsPublishableKey =
  import.meta.env.VITE_MEDUSA_PAYMENTS_PUBLISHABLE_KEY || ""

// Payment methods can be saved with your own Stripe account, Medusa Payments, or Adyen.
export const isCardPaymentsEnabled = !!(
  stripePublishableKey ||
  medusaPaymentsPublishableKey ||
  import.meta.env.VITE_ADYEN_CLIENT_KEY
)

// loadStripe should only be called once per configuration, so we cache the promises.
const stripePromises = new Map<string, Promise<Stripe | null>>()

export const getStripePromise = (key: string, stripeAccount?: string) => {
  const cacheKey = `${key}:${stripeAccount ?? ""}`
  if (!stripePromises.has(cacheKey)) {
    stripePromises.set(
      cacheKey,
      loadStripe(key, stripeAccount ? { stripeAccount } : undefined)
    )
  }

  return stripePromises.get(cacheKey)!
}

// Medusa Payments payments and payment methods live on a Stripe connected account, which Stripe.js is initialized for.
export const getStripePromiseFor = ({
  isMedusaPayments,
  stripeAccount,
}: {
  isMedusaPayments: boolean
  stripeAccount?: string
}) => {
  const key = isMedusaPayments
    ? medusaPaymentsPublishableKey
    : stripePublishableKey
  return key
    ? getStripePromise(key, isMedusaPayments ? stripeAccount : undefined)
    : null
}
