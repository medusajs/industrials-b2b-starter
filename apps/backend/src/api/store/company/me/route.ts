import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateCompanyWorkflow, UpdateCompanyInput } from "../../../../workflows/update-company"

export type UpdateMyCompanyBody = Omit<UpdateCompanyInput, "id" | "status" | "spend_limit_reset_frequency">

export async function POST(
  req: AuthenticatedMedusaRequest<UpdateMyCompanyBody>,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Get customer with linked employee and company data
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: [
      "id",
      "employee.*",
      "employee.company.*",
    ],
    filters: {
      id: customerId,
    },
  })

  const customer = customers[0]
  const employee = customer?.employee

  if (!employee) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Employee not found")
  }

  if (!employee.is_admin) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Only company admins can update company details"
    )
  }

  const { result } = await updateCompanyWorkflow(req.scope).run({
    input: {
      id: employee.company.id,
      ...req.body,
    },
  })

  res.json({ company: result })
}
