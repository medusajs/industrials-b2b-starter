import type {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { setupCompanyWorkflow, SetupCompanyInput } from "../../../workflows/setup-company"

export async function GET(
  req: AuthenticatedMedusaRequest,
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
  
  if (!customer?.employee?.company) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Company not found")
  }

  res.json({ company: customer.employee.company })
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const body = req.validatedBody as SetupCompanyInput

  const { result } = await setupCompanyWorkflow(req.scope).run({
    input: body,
  })

  res.status(201).json({
    company: result.company,
    employee: result.employee,
    customer: result.customer,
  })
}
