/** A company payment method, as returned by the company payment method routes. */
export interface SavedPaymentMethod {
  id: string
  /** The provider the payment method is saved with. */
  provider_id: string
  data: {
    id: string
    /** Stripe and Medusa Payments card details. */
    card?: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
    /** Adyen card details. */
    brand?: string
    lastFour?: string
    expiryMonth?: string
    expiryYear?: string
    type?: string
    [key: string]: unknown
  }
}

export type SavedCardDetails = {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

// Stripe and Adyen describe saved cards differently, so they're normalized for display.
export function getSavedCardDetails(
  method: SavedPaymentMethod
): SavedCardDetails | undefined {
  const { card, brand, lastFour, expiryMonth, expiryYear } = method.data ?? {}

  if (card) {
    return {
      brand: card.brand,
      last4: card.last4,
      expMonth: card.exp_month,
      expYear: card.exp_year,
    }
  }

  if (brand && lastFour) {
    return {
      brand,
      last4: lastFour,
      expMonth: Number(expiryMonth),
      expYear: Number(expiryYear),
    }
  }

  return undefined
}

export function cardBrandLabel(brand: string): string {
  const brands: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    mc: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
    cup: "UnionPay",
  }
  return brands[brand] || brand.charAt(0).toUpperCase() + brand.slice(1)
}
