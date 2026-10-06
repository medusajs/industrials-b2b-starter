import {
  validateAndTransformBody,
  validateAndTransformQuery,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  AdminGetQuoteParams,
  AdminSendQuote,
  AdminRejectQuote,
  AdminCreateQuoteMessage,
} from "./validators"
import {
  listAdminQuoteQueryConfig,
  retrieveAdminQuoteQueryConfig,
} from "./query-config"

export const adminQuotesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/quotes",
    methods: ["GET"],
    middlewares: [
      validateAndTransformQuery(AdminGetQuoteParams, listAdminQuoteQueryConfig),
    ],
  },
  {
    matcher: "/admin/quotes/:id",
    methods: ["GET"],
    middlewares: [
      validateAndTransformQuery(
        AdminGetQuoteParams,
        retrieveAdminQuoteQueryConfig
      ),
    ],
  },
  {
    matcher: "/admin/quotes/:id/send",
    methods: ["POST"],
    middlewares: [
      validateAndTransformBody(AdminSendQuote),
      validateAndTransformQuery(
        AdminGetQuoteParams,
        retrieveAdminQuoteQueryConfig
      ),
    ],
  },
  {
    matcher: "/admin/quotes/:id/reject",
    methods: ["POST"],
    middlewares: [
      validateAndTransformBody(AdminRejectQuote),
      validateAndTransformQuery(
        AdminGetQuoteParams,
        retrieveAdminQuoteQueryConfig
      ),
    ],
  },
  {
    matcher: "/admin/quotes/:id/messages",
    methods: ["POST"],
    middlewares: [
      validateAndTransformBody(AdminCreateQuoteMessage),
      validateAndTransformQuery(
        AdminGetQuoteParams,
        retrieveAdminQuoteQueryConfig
      ),
    ],
  },
]
