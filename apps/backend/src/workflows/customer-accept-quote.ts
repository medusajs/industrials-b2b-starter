import {
  confirmOrderEditRequestWorkflow,
  updateOrderWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { OrderStatus } from "@medusajs/framework/utils"
import { createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { validateQuoteCanAcceptStep } from "./steps/validate-quote-can-accept"
import { validateSpendingLimitStep } from "./steps/validate-spending-limit"
import { QuoteStatus } from "../modules/quote/models/quote"
import { updateQuotesStep } from "./steps/update-quotes"

type WorkflowInput = {
  quote_id: string
  customer_id: string
}

export const customerAcceptQuoteWorkflow = createWorkflow(
  "customer-accept-quote-workflow",
  function (input: WorkflowInput) {
    // Fetch quote with draft order totals for spending limit validation
    const { data: quotes } = useQueryGraphStep({
      entity: "quote",
      fields: [
        "id",
        "draft_order_id",
        "status",
        "draft_order.total",
        "draft_order.currency_code",
      ],
      filters: { id: input.quote_id, customer_id: input.customer_id },
      options: {
        throwIfKeyNotFound: true,
      },
    })

    validateQuoteCanAcceptStep({
      // @ts-ignore
      quote: quotes[0],
    })

    // Validate spending limit before converting quote to order
    const spendingLimitInput = transform({ quotes, input }, ({ quotes, input }) => ({
      customer_id: input.customer_id,
      order_total: Number(quotes[0].draft_order?.total) || 0,
      currency_code: quotes[0].draft_order?.currency_code || "usd",
    }))

    validateSpendingLimitStep(spendingLimitInput)

    updateQuotesStep([{
      id: input.quote_id,
      status: QuoteStatus.ACCEPTED,
    }])

    confirmOrderEditRequestWorkflow.runAsStep({
      input: {
        order_id: quotes[0].draft_order_id,
        confirmed_by: input.customer_id,
      },
    })

    updateOrderWorkflow.runAsStep({
      input: {
        id: quotes[0].draft_order_id,
        // @ts-ignore
        status: OrderStatus.PENDING,
        is_draft_order: false,
      },
    })
  }
)
