import React from "react"
import { Cash, CreditCard } from "@medusajs/icons"
import { isAdyen, isMedusaPayments } from "@/lib/utils/checkout"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentMethodsData: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  pp_system_default: {
    title: "Manual Payment",
    icon: <Cash />,
  },
  // Add more payment providers here
}

const medusaPaymentsInfo = {
  title: "Credit card",
  icon: <CreditCard />,
}

const adyenInfo = {
  title: "Card, Apple Pay, or Google Pay",
  icon: <CreditCard />,
}

export const getPaymentMethodInfo = (providerId?: string) => {
  if (!providerId) {
    return undefined
  }

  if (isMedusaPayments(providerId)) {
    return medusaPaymentsInfo
  }

  if (isAdyen(providerId)) {
    return adyenInfo
  }

  return paymentMethodsData[providerId]
}
