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

  // First, get the employee data for the current customer to check if they're admin
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
      "Only admin employees can view the employee list"
    )
  }

  // Parse query params
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 15
  const search = (req.query.search as string) || ""
  const sortBy = (req.query.sortBy as string) || "created_at"
  const sortOrder = (req.query.sortOrder as string) || "desc"
  const offset = (page - 1) * limit

  // Get all employees for the company with their customer data
  const { data: employees } = await query.graph({
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
    filters: {
      company_id: currentEmployee.company_id,
    },
  })

  // Filter by search if provided (search by name or email)
  let filteredEmployees = employees
  if (search) {
    const searchLower = search.toLowerCase()
    filteredEmployees = employees.filter((emp: any) => {
      const firstName = emp.customer?.first_name?.toLowerCase() || ""
      const lastName = emp.customer?.last_name?.toLowerCase() || ""
      const email = emp.customer?.email?.toLowerCase() || ""
      return (
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        email.includes(searchLower) ||
        `${firstName} ${lastName}`.includes(searchLower)
      )
    })
  }

  // Sort employees
  filteredEmployees.sort((a: any, b: any) => {
    let aVal: any
    let bVal: any

    switch (sortBy) {
      case "name":
        aVal = `${a.customer?.first_name || ""} ${a.customer?.last_name || ""}`.toLowerCase()
        bVal = `${b.customer?.first_name || ""} ${b.customer?.last_name || ""}`.toLowerCase()
        break
      case "email":
        aVal = a.customer?.email?.toLowerCase() || ""
        bVal = b.customer?.email?.toLowerCase() || ""
        break
      case "spending_limit":
        aVal = a.spending_limit === null ? Infinity : Number(a.spending_limit)
        bVal = b.spending_limit === null ? Infinity : Number(b.spending_limit)
        break
      default:
        aVal = a.created_at
        bVal = b.created_at
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
    return 0
  })

  // Paginate
  const total = filteredEmployees.length
  const paginatedEmployees = filteredEmployees.slice(offset, offset + limit)

  res.json({
    employees: paginatedEmployees,
    count: total,
    limit,
    offset,
    page,
    pageCount: Math.ceil(total / limit),
  })
}
