import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { requireEmployeeAdmin } from "../../middlewares/require-employee-admin"

export const UpdateSpendingLimitSchema = z.object({
  spending_limit: z.number().nullable(),
})

export const InviteEmployeeSchema = z.object({
  email: z.string().email(),
  spending_limit: z.number().nullable().optional(),
  is_admin: z.boolean().optional(),
})

export const GetEmployeeInvitesSchema = createFindParams()

export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
})

export const employeesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/employees",
    method: "GET",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/employees/:id",
    method: "POST",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      validateAndTransformBody(UpdateSpendingLimitSchema),
    ],
  },
  {
    matcher: "/store/employees/invite",
    method: "POST",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      validateAndTransformBody(InviteEmployeeSchema),
      requireEmployeeAdmin,
    ],
  },
  {
    matcher: "/store/employees/invites",
    method: "GET",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      requireEmployeeAdmin,
      validateAndTransformQuery(GetEmployeeInvitesSchema, {
        defaults: ["id", "email", "token", "accepted", "expires_at", "metadata", "created_at"],
        isList: true,
        defaultLimit: 50,
      }),
    ],
  },
  {
    matcher: "/store/employees/invites/:id/resend",
    method: "POST",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      requireEmployeeAdmin,
    ],
  },
  {
    matcher: "/store/employees/invites/accept",
    method: "POST",
    middlewares: [
      authenticate("customer", ["bearer", "session"], { "allowUnregistered": true }),
      validateAndTransformBody(AcceptInviteSchema),
    ],
  },
  
]
