import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Not authenticated")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Get customer with employee data to determine filtering strategy
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.*", "employee.company.*"],
    filters: {
      id: customerId,
    },
  }) as unknown as {
    data: Array<{
      id: string
      employee?: {
        id: string
        is_admin: boolean
        company_id: string
        company?: { id: string; name: string }
      }
    }>
  }

  const customer = customers[0]
  const employee = customer?.employee

  if (!employee) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Employee not found")
  }

  const isAdmin = employee.is_admin
  const companyId = employee.company_id

  // Get all employees in the company to find all customer IDs
  let customerIds: string[] = [customerId]

  if (isAdmin) {
    // Admin sees company-wide stats - get all employees in the company
    const { data: companyEmployees } = await query.graph({
      entity: "employee",
      fields: ["id", "customer.*"],
      filters: {
        company_id: companyId,
      },
    }) as { data: Array<{ id: string; customer: { id: string } }> }

    customerIds = companyEmployees
      .filter((e) => e.customer?.id)
      .map((e) => e.customer.id)
  }

  // Fetch orders for the customer(s)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "status", "customer_id", "created_at", "total", "display_id"],
    filters: {
      customer_id: customerIds,
    },
  }) as unknown as {
    data: Array<{
      id: string
      status: string
      customer_id: string
      created_at: string
      total: number
      display_id: number
    }>
  }

  // Fetch quotes for the customer(s)
  const { data: quotes } = await query.graph({
    entity: "quote",
    fields: ["id", "status", "customer_id", "created_at"],
    filters: {
      customer_id: customerIds,
    },
  }) as unknown as {
    data: Array<{
      id: string
      status: string
      customer_id: string
      created_at: string
    }>
  }

  // Calculate stats
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // Total orders (all time)
  const totalOrders = orders.length

  // Orders in last 30 days vs previous 30 days
  const recentOrders = orders.filter(
    (o) => new Date(o.created_at) >= thirtyDaysAgo
  )
  const previousOrders = orders.filter(
    (o) =>
      new Date(o.created_at) >= sixtyDaysAgo &&
      new Date(o.created_at) < thirtyDaysAgo
  )
  const orderChange =
    previousOrders.length > 0
      ? Math.round(
          ((recentOrders.length - previousOrders.length) /
            previousOrders.length) *
            100
        )
      : recentOrders.length > 0
        ? 100
        : 0

  // Pending quotes (pending_merchant or pending_customer)
  const pendingQuotes = quotes.filter(
    (q) => q.status === "pending_merchant" || q.status === "pending_customer"
  )
  const pendingQuotesCount = pendingQuotes.length

  // Quote change - quotes created in last 30 days vs previous 30 days
  const recentQuotes = quotes.filter(
    (q) => new Date(q.created_at) >= thirtyDaysAgo
  )
  const previousQuotes = quotes.filter(
    (q) =>
      new Date(q.created_at) >= sixtyDaysAgo &&
      new Date(q.created_at) < thirtyDaysAgo
  )
  const quoteChange = recentQuotes.length - previousQuotes.length

  // Monthly spend (orders in last 30 days)
  const monthlySpend = recentOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const previousMonthSpend = previousOrders.reduce(
    (sum, o) => sum + (o.total || 0),
    0
  )
  const spendChange =
    previousMonthSpend > 0
      ? Math.round(
          ((monthlySpend - previousMonthSpend) / previousMonthSpend) * 100
        )
      : monthlySpend > 0
        ? 100
        : 0

  // Total spend (all time)
  const totalSpend = orders.reduce((sum, o) => sum + (o.total || 0), 0)

  // Get employee count for admins
  let employeeCount = 1
  if (isAdmin) {
    const { data: allEmployees } = await query.graph({
      entity: "employee",
      fields: ["id"],
      filters: {
        company_id: companyId,
      },
    }) as { data: { id: string }[] }
    employeeCount = allEmployees.length
  }

  // Recent activity - combine recent orders and quotes
  const recentActivity: Array<{
    type: "order" | "quote"
    description: string
    time: string
    created_at: string
  }> = []

  // Add recent orders to activity
  orders
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)
    .forEach((order) => {
      const statusLabel =
        order.status === "completed"
          ? "completed"
          : order.status === "pending"
            ? "placed"
            : order.status
      recentActivity.push({
        type: "order",
        description: `Order #${order.display_id} ${statusLabel}`,
        time: formatRelativeTime(new Date(order.created_at)),
        created_at: order.created_at,
      })
    })

  // Add recent quotes to activity
  quotes
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)
    .forEach((quote) => {
      const statusLabel =
        quote.status === "accepted"
          ? "accepted"
          : quote.status === "pending_merchant"
            ? "pending review"
            : quote.status === "pending_customer"
              ? "awaiting response"
              : quote.status === "customer_rejected" ||
                  quote.status === "merchant_rejected"
                ? "rejected"
                : quote.status
      recentActivity.push({
        type: "quote",
        description: `Quote request ${statusLabel}`,
        time: formatRelativeTime(new Date(quote.created_at)),
        created_at: quote.created_at,
      })
    })

  // Sort all activity by date and take top 5
  recentActivity.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const topActivity = recentActivity.slice(0, 5)

  res.json({
    stats: {
      total_orders: totalOrders,
      order_change: orderChange,
      pending_quotes: pendingQuotesCount,
      quote_change: quoteChange,
      monthly_spend: monthlySpend,
      spend_change: spendChange,
      total_spend: totalSpend,
      employee_count: employeeCount,
    },
    recent_activity: topActivity.map(({ created_at, ...rest }) => rest),
    is_admin: isAdmin,
  })
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`
}
