import { MedusaError, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"
import EmployeeCustomerLink from "../links/employee-customer"

export type SpendLimitResetFrequency = "none" | "daily" | "weekly" | "monthly" | "yearly"

export type ValidateSpendingLimitParams = {
  container: MedusaContainer
  customer_id: string | null
  order_total: number // in whole currency units (e.g., dollars, not cents)
  currency_code: string
}

/**
 * Calculates the start date of the spending window based on reset frequency.
 */
function getSpendingWindowStart(frequency: SpendLimitResetFrequency): Date | null {
  if (frequency === "none") {
    return null
  }

  const now = new Date()

  switch (frequency) {
    case "daily":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case "weekly":
      const dayOfWeek = now.getDay()
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
    case "monthly":
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case "yearly":
      return new Date(now.getFullYear(), 0, 1)
    default:
      return null
  }
}

function getPeriodLabel(frequency: SpendLimitResetFrequency): string {
  switch (frequency) {
    case "daily": return "daily"
    case "weekly": return "weekly"
    case "monthly": return "monthly"
    case "yearly": return "yearly"
    case "none": return "total"
    default: return ""
  }
}

/**
 * Validates an employee's spending limit before order creation.
 * Calculates cumulative spending within the company's reset frequency window.
 * Throws MedusaError if limit would be exceeded.
 * 
 * @param params - The validation parameters
 * @returns void - Returns silently if validation passes
 * @throws MedusaError if company is not active or spending limit would be exceeded
 */
export async function validateSpendingLimit(params: ValidateSpendingLimitParams): Promise<void> {
  const { container, customer_id, order_total, currency_code } = params

  // Only validate for authenticated customers
  if (!customer_id) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

  // Find the employee linked to this customer
  const { data: links } = await query.graph({
    entity: EmployeeCustomerLink.entryPoint,
    fields: ["employee.*", "employee.company.*"],
    filters: {
      customer_id,
    },
  })

  const employees = links?.map((link: any) => link.employee).filter(Boolean) || []

  // If no employee record, this is not a B2B customer - allow purchase
  if (!employees || employees.length === 0) {
    return
  }

  const employee = employees[0]
  const company = employee.company

  // Check company status
  if (company?.status !== "active") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Your company account is not active. Current status: ${company?.status}. Please contact your administrator.`
    )
  }

  // If spending_limit is null, employee has unlimited spending
  if (employee.spending_limit === null || employee.spending_limit === undefined) {
    return
  }

  // spending_limit and order.total are both stored in whole currency units (e.g., dollars, not cents)
  const spendingLimit = Number(employee.spending_limit)
  const resetFrequency = (company?.spend_limit_reset_frequency || "none") as SpendLimitResetFrequency

  // Calculate the spending window
  const windowStart = getSpendingWindowStart(resetFrequency)

  // Build filter for orders
  const orderFilters: Record<string, any> = {
    customer_id,
    status: { $nin: ["canceled", "archived"] },
  }

  if (windowStart) {
    orderFilters.created_at = { $gte: windowStart.toISOString() }
  }

  // Query completed orders within the window
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "total", "currency_code"],
    filters: orderFilters,
  })

  // Sum previous spending (same currency)
  const previousSpending = orders
    .filter((order: any) => order.currency_code === currency_code)
    .reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0)

  const totalWithNewOrder = previousSpending + order_total

  if (totalWithNewOrder > spendingLimit) {
    const periodLabel = getPeriodLabel(resetFrequency)

    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `This order would exceed your ${periodLabel} spending limit. Please contact your company administrator for approval.`
    )
  }
}
