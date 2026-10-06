import { Link, useParams, useLoaderData } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { useLatestProducts } from "@/lib/hooks/use-products"
import { useCategories } from "@/lib/hooks/use-categories"
import { ProductCard } from "@/components/product-card"
import { PublicHomePage } from "./public-home"
import { useAuth } from "@/lib/hooks/use-auth"
import { DashboardPageLayout } from "@/components/dashboard-page-layout"
import { useQuery } from "@tanstack/react-query"
import { getDashboardStats, RecentActivity } from "@/lib/data/dashboard"
import { CompanySetupBanner } from "@/components/company-setup-banner"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatChange(value: number, isPercent: boolean = true): string {
  const prefix = value > 0 ? "+" : ""
  return isPercent ? `${prefix}${value}%` : `${prefix}${value}`
}

function getTrend(value: number): "up" | "down" | "neutral" {
  if (value > 0) return "up"
  if (value < 0) return "down"
  return "neutral"
}

function ActivityIcon({ type }: { type: RecentActivity["type"] }) {
  if (type === "order") {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

export default function Home() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"
  const loaderData = useLoaderData({ strict: false }) as { region?: HttpTypes.StoreRegion } | undefined
  const region = loaderData?.region
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const { data: latestProductsData } = useLatestProducts({
    limit: 4,
    region_id: region?.id,
  })

  const { data: dashboardData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    enabled: isAuthenticated,
  })

  const { data: categories = [] } = useCategories({
    queryParams: {
      include_ancestors_tree: false,
    },
  })

  const products = latestProductsData?.products || []

  // Show loading or public home while checking auth
  if (authLoading || !isAuthenticated) {
    return <PublicHomePage products={products} categories={categories} />
  }

  const stats = dashboardData?.stats
  const recentActivity = dashboardData?.recent_activity || []
  const isAdmin = dashboardData?.is_admin || false

  // Build stats array from real data
  const statsDisplay = [
    {
      label: "Total Orders",
      value: stats ? stats.total_orders.toString() : "-",
      change: stats ? formatChange(stats.order_change) : "-",
      trend: stats ? getTrend(stats.order_change) : "neutral",
    },
    {
      label: "Pending Quotes",
      value: stats ? stats.pending_quotes.toString() : "-",
      change: stats ? formatChange(stats.quote_change, false) : "-",
      trend: stats ? getTrend(stats.quote_change) : "neutral",
    },
    {
      label: isAdmin ? "Team Members" : "Total Spend",
      value: stats
        ? isAdmin
          ? stats.employee_count.toString()
          : formatCurrency(stats.total_spend)
        : "-",
      change: "-",
      trend: "neutral" as const,
    },
    {
      label: "Monthly Spend",
      value: stats ? formatCurrency(stats.monthly_spend) : "-",
      change: stats ? formatChange(stats.spend_change) : "-",
      trend: stats ? getTrend(stats.spend_change) : "neutral",
    },
  ]

  return (
    <DashboardPageLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back. Here's an overview of {isAdmin ? "your company's" : "your"} account.
        </p>
      </div>

      {/* Company Setup Banner (shown when setup incomplete) */}
      <div className="mb-8">
        <CompanySetupBanner />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsDisplay.map((stat, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl border border-gray-200 p-6 ${
              statsLoading ? "animate-pulse" : ""
            }`}
          >
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.change !== "-" && (
                <span
                  className={`text-sm font-medium ${
                    stat.trend === "up"
                      ? "text-green-600"
                      : stat.trend === "down"
                        ? "text-red-600"
                        : "text-gray-500"
                  }`}
                >
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to={"/$countryCode/store" as string} params={{ countryCode }}
          className="bg-teal-600 hover:bg-teal-700 rounded-xl p-6 text-white transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <svg className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-1">New Order</h3>
          <p className="text-sm text-white/80">Browse catalog and place an order</p>
        </Link>

        <Link
          to={"/$countryCode/quotes" as string} params={{ countryCode }}
          className="bg-white hover:bg-gray-50 rounded-xl border border-gray-200 p-6 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg text-gray-900 mb-1">View Quotes</h3>
          <p className="text-sm text-gray-600">Check status of your quote requests</p>
        </Link>

        <Link
          to={"/$countryCode/orders" as string} params={{ countryCode }}
          className="bg-white hover:bg-gray-50 rounded-xl border border-gray-200 p-6 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg text-gray-900 mb-1">Order History</h3>
          <p className="text-sm text-gray-600">View and reorder past purchases</p>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Products */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Featured Equipment</h2>
              <Link
                to={"/$countryCode/store" as string} params={{ countryCode }}
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                View all
              </Link>
            </div>
            {products.length > 0 && region ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.slice(0, 4).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    regionId={region.id}
                    countryCode={countryCode}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Loading products...</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === "order"
                          ? "bg-teal-100 text-teal-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <ActivityIcon type={activity.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-1">Place an order or request a quote to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  )
}
