import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../../modules/company"
import CompanyModuleService from "../../../../modules/company/service"

/**
 * GET /store/company/quotes
 * 
 * For admin employees: returns all quotes from all employees in the company.
 * For non-admin employees: returns only the current customer's quotes.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const companyModuleService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)
  const orderModuleService = req.scope.resolve(Modules.ORDER)

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
    return res.json({ quotes: [], count: 0, offset: 0, limit: 20 })
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
    // Non-admin: only their own quotes
    customerIds = [customerId]
  }

  if (customerIds.length === 0) {
    return res.json({ quotes: [], count: 0, offset: 0, limit: 20 })
  }

  // Parse query params
  const limit = parseInt(req.query.limit as string) || 20
  const offset = parseInt(req.query.offset as string) || 0

  // Query quotes for all relevant customers
  // Note: cart.total is a computed field, must be explicitly requested
  const { data: quotes, metadata } = await query.graph({
    entity: "quote",
    fields: [
      "id",
      "status",
      "customer_id",
      "draft_order_id",
      "order_change_id",
      "cart_id",
      "created_at",
      "updated_at",
      // Cart fields with explicit totals (computed fields)
      "cart.id",
      "cart.currency_code",
      "cart.total",
      "cart.subtotal",
      "cart.tax_total",
      "cart.item_total",
      "cart.items.*",
      // Draft order fields with explicit totals
      "draft_order.id",
      "draft_order.display_id",
      "draft_order.currency_code",
      "draft_order.total",
      "draft_order.subtotal",
      "draft_order.tax_total",
      "draft_order.items.*",
      "draft_order.items.variant.*",
      "draft_order.items.variant.product.*",
      "customer.id",
      "customer.email",
      "customer.first_name",
      "customer.last_name",
    ],
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

  // Fetch order previews for pending_customer and accepted quotes
  const quotesWithPreviews = await Promise.all(
    quotes.map(async (quote: any) => {
      if ((quote.status === "pending_customer" || quote.status === "accepted") && quote.draft_order_id) {
        try {
          const preview = await orderModuleService.previewOrderChange(
            quote.draft_order_id
          )
          return { ...quote, order_preview: preview }
        } catch {
          return quote
        }
      }
      return quote
    })
  )

  // For admin view, attach employee info to each quote
  if (isAdmin && quotesWithPreviews.length > 0) {
    // Get customer details for all quotes
    const quoteCustomerIds = [...new Set(quotesWithPreviews.map((q: any) => q.customer_id))]
    const { data: quoteCustomers } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name", "employee.id", "employee.is_admin"],
      filters: { id: quoteCustomerIds },
    })

    const customerMap = new Map(quoteCustomers.map((c: any) => [c.id, c]))

    quotesWithPreviews.forEach((quote: any) => {
      const quoteCustomer = customerMap.get(quote.customer_id)
      if (quoteCustomer) {
        quote.requested_by = {
          id: quoteCustomer.id,
          email: quoteCustomer.email,
          first_name: quoteCustomer.first_name,
          last_name: quoteCustomer.last_name,
          is_admin: quoteCustomer.employee?.is_admin || false,
        }
      }
    })
  }

  res.json({
    quotes: quotesWithPreviews,
    count: metadata?.count || quotesWithPreviews.length,
    offset,
    limit,
  })
}
