import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { acceptEmployeeInviteWorkflow } from "../../../../../workflows/accept-employee-invite"

type AcceptInviteBody = {
  token: string
  first_name: string
  last_name: string
  phone?: string
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { token, first_name, last_name, phone } = req.validatedBody as AcceptInviteBody

  // Require authentication - the auth_identity was created during registration
  const authIdentityId = req.auth_context?.auth_identity_id
  if (!authIdentityId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required. Please register first."
    )
  }

  const { result } = await acceptEmployeeInviteWorkflow(req.scope).run({
    input: {
      token,
      first_name,
      last_name,
      phone,
      auth_identity_id: authIdentityId,
    },
  })

  res.json({
    success: true,
    customer: {
      id: result.customer.id,
      email: result.customer.email,
      first_name,
      last_name,
    },
    employee: {
      id: result.employee.id,
      is_admin: result.is_admin,
      spending_limit: result.spending_limit,
    },
    company_id: result.company_id,
  })
}
