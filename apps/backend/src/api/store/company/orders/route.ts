import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../../modules/company"
import CompanyModuleService from "../../../../modules/company/service"

/**
 * GET /store/company/orders
 * 
 * For admin employees: returns all orders from all employees in the company.
 * For non-admin employees: returns only the current customer's orders.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const companyModuleService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  const customerId = req.auth_context.actor_id

  // Get employee info to check if admin
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.*", "employee.company.*"],
    filters: { id: customerId },
  })

  const customer = customers[0]
  const employee = customer?.employee
  const company = employee?.company
  const isAdmin = employee?.is_admin === true

  if (!employee || !company) {
    // Not a B2B customer, return empty
    return res.json({ orders: [], count: 0, offset: 0, limit: 20 })
  }

  let customerIds: string[] = []

  if (isAdmin) {
    // Admin: get all employees in the company
    const employees = await companyModuleService.listEmployees({
      company_id: company.id,
    })

    // Get customer IDs for all employees by querying each employee's linked customer
    const employeeIds = employees.map((emp) => emp.id)

    if (employeeIds.length > 0) {
      // Query employees with their linked customers
      const { data: employeesWithCustomers } = await query.graph({
        entity: "employee",
        fields: ["id", "customer.id"],
        filters: {
          id: employeeIds,
        },
      })
      
      customerIds = employeesWithCustomers
        .filter((e: any) => e.customer?.id)
        .map((e: any) => e.customer.id)
    }
  } else {
    // Non-admin: only their own orders
    customerIds = [customerId]
  }

  if (customerIds.length === 0) {
    return res.json({ orders: [], count: 0, offset: 0, limit: 20 })
  }

  // Parse query params
  const limit = parseInt(req.query.limit as string) || 20
  const offset = parseInt(req.query.offset as string) || 0

  // Order fields with explicit totals (computed fields must be requested explicitly)
  const orderFields = [
    "id",
    "display_id",
    "status",
    "created_at",
    "updated_at",
    "customer_id",
    "email",
    "currency_code",
    // Computed total fields
    "total",
    "subtotal",
    "tax_total",
    "discount_total",
    "shipping_total",
    "item_total",
    // Related entities
    "items.*",
    "items.variant.*",
    "items.variant.product.*",
    "shipping_address.*",
    "billing_address.*",
    "shipping_methods.*",
    "payment_collections.*",
  ]

  // Query orders for all relevant customers
  const { data: orders, metadata } = await query.graph({
    entity: "order",
    fields: orderFields,
    filters: {
      customer_id: customerIds,
    },
    pagination: {
      skip: offset,
      take: limit,
      order: {
        created_at: "DESC",
      },
    },
  })

  // For admin view, attach employee info to each order
  if (isAdmin && orders.length > 0) {
    // Get customer details for all orders
    const orderCustomerIds = [...new Set(orders.map((o: any) => o.customer_id))]
    const { data: orderCustomers } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name", "employee.id", "employee.is_admin"],
      filters: { id: orderCustomerIds },
    })

    const customerMap = new Map(orderCustomers.map((c: any) => [c.id, c]))

    orders.forEach((order: any) => {
      const orderCustomer = customerMap.get(order.customer_id)
      if (orderCustomer) {
        order.placed_by = {
          id: orderCustomer.id,
          email: orderCustomer.email,
          first_name: orderCustomer.first_name,
          last_name: orderCustomer.last_name,
          is_admin: orderCustomer.employee?.is_admin || false,
        }
      }
    })
  }

  res.json({
    orders,
    count: metadata?.count || orders.length,
    offset,
    limit,
  })
}
