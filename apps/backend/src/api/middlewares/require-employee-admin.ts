import { AuthenticatedMedusaRequest, MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export type RequestWithCompany = AuthenticatedMedusaRequest & {
  company_id: string
}

export async function requireEmployeeAdmin(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const customerId = (req as AuthenticatedMedusaRequest).auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "Customer not authenticated"
      )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.*"],
    filters: { id: customerId },
  })

  const currentCustomer = customers[0]
  const currentEmployee = currentCustomer?.employee

  if (!currentEmployee) {
    throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Employee not found for this customer"
      )
  }

  if (!currentEmployee.is_admin) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "Only admin employees can perform this action"
      )
  }

  // Attach company_id to request for use in route handlers
  (req as RequestWithCompany).company_id = currentEmployee.company_id as string

  next()
}
