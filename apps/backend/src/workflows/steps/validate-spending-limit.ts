import { createStep } from "@medusajs/framework/workflows-sdk"
import { validateSpendingLimit } from "../../utils/validate-spending-limit"

export type ValidateSpendingLimitInput = {
  customer_id: string | null
  order_total: number // in cents/smallest currency unit
  currency_code: string
}

/**
 * Step that validates the employee's spending limit before order creation.
 * Calculates cumulative spending within the company's reset frequency window.
 * Throws MedusaError if limit would be exceeded.
 */
export const validateSpendingLimitStep = createStep(
  "validate-spending-limit-step",
  async function (input: ValidateSpendingLimitInput, { container }) {
    await validateSpendingLimit({
      container,
      customer_id: input.customer_id,
      order_total: input.order_total,
      currency_code: input.currency_code,
    })
  }
)
