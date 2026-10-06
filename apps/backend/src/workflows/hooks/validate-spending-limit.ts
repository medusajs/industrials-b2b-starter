import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { validateSpendingLimit } from "../../utils/validate-spending-limit"

/**
 * Hook that validates the employee's spending limit before completing a cart.
 * Checks cumulative spending within the company's reset frequency window.
 */
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  await validateSpendingLimit({
    container,
    customer_id: cart.customer_id || null,
    order_total: cart.total || 0,
    currency_code: cart.currency_code || "",
  })
})
