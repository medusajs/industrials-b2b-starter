import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createRequestForQuoteWorkflow } from "../../../../../workflows/create-request-for-quote"
import { CreateQuoteType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateQuoteType>,
  res: MedusaResponse
) => {
  const {
    result: { quote: createdQuote },
  } = await createRequestForQuoteWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      customer_id: req.auth_context.actor_id,
    },
  })

  const query = req.scope.resolve(
    ContainerRegistrationKeys.QUERY
  )

  const {
    data: [quote],
  } = await query.graph(
    {
      entity: "quote",
      fields: req.queryConfig.fields,
      filters: { id: createdQuote.id },
    },
    { throwIfKeyNotFound: true }
  )

  return res.json({ quote })
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const orderModuleService = req.scope.resolve(Modules.ORDER)

  const { data: quotes, metadata } = await query.graph({
    entity: "quote",
    fields: req.queryConfig.fields,
    filters: { customer_id: req.auth_context.actor_id },
    pagination: req.queryConfig.pagination,
  })

  // Fetch order previews for pending_customer and accepted quotes to show savings in the list
  const quotesWithPreviews = await Promise.all(
    quotes.map(async (quote: any) => {
      if ((quote.status === "pending_customer" || quote.status === "accepted") && quote.draft_order_id) {
        try {
          const preview = await orderModuleService.previewOrderChange(
            quote.draft_order_id
          )
          return { ...quote, order_preview: preview }
        } catch {
          return quote
        }
      }
      return quote
    })
  )

  res.json({
    quotes: quotesWithPreviews,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
