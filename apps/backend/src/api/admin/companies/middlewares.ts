import {
  validateAndTransformBody,
  validateAndTransformQuery,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "@medusajs/framework/zod"

const GetCompaniesSchema = createFindParams()

const UpdateCompanySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  status: z.enum(["pending", "active", "inactive", "suspended"]).optional(),
  spend_limit_reset_frequency: z
    .enum(["none", "daily", "weekly", "monthly", "yearly"])
    .optional(),
})

export const adminCompaniesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/companies",
    methods: ["GET"],
    middlewares: [
      validateAndTransformQuery(GetCompaniesSchema, {
        isList: true,
        defaults: [
          "id",
          "name",
          "email",
          "logo_url",
          "status",
          "spend_limit_reset_frequency",
          "created_at",
          "country_code",
          "employees.*",
        ],
      }),
    ],
  },
  {
    matcher: "/admin/companies/:id",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(UpdateCompanySchema)],
  },
]
