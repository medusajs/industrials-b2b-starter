import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

type AuthenticatedRequest = MedusaRequest & {
  auth_context?: { actor_id?: string }
}

export async function GET(
  req: AuthenticatedRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer not authenticated"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Get customer with linked employee data
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: [
      "id",
      "email",
      "first_name",
      "last_name",
      "phone",
      "company_name",
      "employee.*",
      "employee.company.*",
    ],
    filters: {
      id: customerId,
    },
  })

  const customer = customers[0]

  if (!customer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Customer not found"
    )
  }

  res.json({ customer })
}
