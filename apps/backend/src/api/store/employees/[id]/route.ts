import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../../modules/company"

type AuthenticatedRequest = MedusaRequest & {
  auth_context?: { actor_id?: string }
}

export async function POST(
  req: AuthenticatedRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  const employeeId = req.params.id

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer not authenticated"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Get the current user's employee data to verify they're an admin
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.*"],
    filters: { id: customerId },
  })

  const currentEmployee = customers[0]?.employee

  if (!currentEmployee) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Employee not found for this customer"
    )
  }

  if (!currentEmployee.is_admin) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Only admin employees can update spending limits"
    )
  }

  // Get the target employee to verify they belong to the same company
  const { data: targetEmployees } = await query.graph({
    entity: "employee",
    fields: ["id", "company_id", "is_admin"],
    filters: { id: employeeId },
  })

  const targetEmployee = targetEmployees[0]

  if (!targetEmployee) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Target employee not found"
    )
  }

  if (targetEmployee.company_id !== currentEmployee.company_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Cannot update employee from different company"
    )
  }

  // Don't allow setting spending limits on admin employees
  if (targetEmployee.is_admin) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Cannot set spending limit on admin employees"
    )
  }

  // Update the spending limit
  const { spending_limit } = req.body as { spending_limit: number | null }

  const companyModuleService = req.scope.resolve(COMPANY_MODULE)
  const updatedEmployee = await companyModuleService.updateEmployees({
    id: employeeId,
    spending_limit,
  })

  // Fetch the updated employee with customer data
  const { data: updatedEmployees } = await query.graph({
    entity: "employee",
    fields: [
      "id",
      "is_admin",
      "spending_limit",
      "created_at",
      "customer.id",
      "customer.email",
      "customer.first_name",
      "customer.last_name",
    ],
    filters: { id: employeeId },
  })

  res.json({ employee: updatedEmployees[0] })
}
