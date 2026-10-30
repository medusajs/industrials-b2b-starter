import { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/utils/sdk"
import { getStoredCart } from "@/lib/utils/cart"

// ============ PAYMENT METHOD CHECKS ============

/*
 * Medusa Payments registers one provider per payment account, with the ID
 * `pp_medusa-payments_{account}`, where `{account}` is the Medusa Cloud payment account ID.
 */
const MEDUSA_PAYMENTS_PREFIX = "pp_medusa-payments_"

export const isMedusaPayments = (providerId?: string) => {
  return !!providerId?.startsWith(MEDUSA_PAYMENTS_PREFIX)
}

// Medusa Payments returns the Stripe account that holds the payment, which Stripe.js has to be initialized with.
// It isn't derived from the provider ID, as non-production environments take payments with a sandbox account.
export const getMedusaPaymentsAccount = (paymentSession?: {
  provider_id: string
  data?: Record<string, unknown>
}) => {
  const account = paymentSession?.data?.stripe_account
  return isMedusaPayments(paymentSession?.provider_id) &&
    typeof account === "string"
    ? account
    : undefined
}

// Card payments through Stripe, either with your own Stripe account or Medusa Payments.
export const isStripe = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") ||
    providerId === "stripe" ||
    isMedusaPayments(providerId)
  )
}

/*
 * Adyen registers its provider with the ID `pp_adyen_{id}`, where `{id}` is the ID set in
 * `medusa-config.ts`. Its Drop-in offers cards, Apple Pay, and Google Pay.
 */
export const isAdyen = (providerId?: string) => {
  return !!providerId?.startsWith("pp_adyen_")
}

export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default") || providerId === "manual"
}

// ============ ACTIVE PAYMENT SESSION ============

export const getActivePaymentSession = (cart: HttpTypes.StoreCart): HttpTypes.StorePaymentSession | undefined => {
  return cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )
}

// ============ GIFT CARD CHECK ============

export const isPaidWithGiftCard = (cartOrOrder: HttpTypes.StoreCart | HttpTypes.StoreOrder): boolean => {
  return (cartOrOrder as any)?.gift_cards &&
  (cartOrOrder as any)?.gift_cards?.length > 0 &&
  cartOrOrder?.total === 0
}

// ============ CALCULATE SHIPPING PRICE ============

export const calculatePriceForShippingOption = async ({
  option_id,
  data,
}: {
  option_id: string;
  data?: Record<string, unknown>;
}): Promise<HttpTypes.StoreCartShippingOption> => {
  const cartId = getStoredCart()

  if (!cartId) {
    throw new Error("No cart found")
  }

  const body: { cart_id: string; data?: Record<string, unknown> } = {
    cart_id: cartId,
  }

  if (data) {
    body.data = data
  }

  const { shipping_option } =
    await sdk.store.fulfillment.calculate(option_id, body)
  return shipping_option
}
