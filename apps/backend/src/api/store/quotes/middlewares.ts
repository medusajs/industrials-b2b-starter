import {
  validateAndTransformBody,
  validateAndTransformQuery,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { CreateQuote, GetQuoteParams } from "../validators"
import { listStoreQuoteQueryConfig } from "../customers/me/quotes/query-config"

export const storeQuotesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/customers/me/quotes",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(CreateQuote)],
  },
  {
    matcher: "/store/customers/me/quotes*",
    middlewares: [
      validateAndTransformQuery(GetQuoteParams, listStoreQuoteQueryConfig),
    ],
  },
]
