import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/lib/hooks/use-auth"
import { useQuotes, useAcceptQuote, useRejectQuote, useQuotePreview, type QuoteWithRequestedBy } from "@/lib/hooks/use-quotes"
import { DashboardPageLayout } from "@/components/dashboard-page-layout"
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu"
import {
  DocumentText,
  Clock,
  CheckCircleSolid,
  XCircleSolid,
  Eye,
  XMark,
  ShoppingBag,
} from "@medusajs/icons"
import { toast } from "sonner"
import type { Quote } from "@/lib/data/quotes"

function formatCurrency(
  amount: number | null | undefined,
  currencyCode: string
): string {
  if (amount === null || amount === undefined) return "-"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getStatusConfig(status: string) {
  switch (status) {
    case "pending_merchant":
      return {
        label: "Pending Review",
        icon: Clock,
        bgClass: "bg-amber-100 text-amber-700",
      }
    case "pending_customer":
      return {
        label: "Awaiting Your Response",
        icon: Clock,
        bgClass: "bg-blue-100 text-blue-700",
      }
    case "accepted":
      return {
        label: "Accepted",
        icon: CheckCircleSolid,
        bgClass: "bg-green-100 text-green-700",
      }
    case "customer_rejected":
      return {
        label: "Declined by You",
        icon: XCircleSolid,
        bgClass: "bg-red-100 text-red-700",
      }
    case "merchant_rejected":
      return {
        label: "Declined by Merchant",
        icon: XCircleSolid,
        bgClass: "bg-gray-100 text-gray-700",
      }
    default:
      return {
        label: status,
        icon: DocumentText,
        bgClass: "bg-gray-100 text-gray-700",
      }
  }
}

interface QuoteDetailModalProps {
  quote: Quote
  quoteWithPreview: Quote | undefined
  isLoadingPreview: boolean
  countryCode: string
  onClose: () => void
  onAccept: () => void
  onReject: () => void
  isResponding: boolean
  onViewOrder?: () => void
}

function QuoteDetailModal({
  quote,
  quoteWithPreview,
  isLoadingPreview,
  countryCode,
  onClose,
  onAccept,
  onReject,
  isResponding,
  onViewOrder,
}: QuoteDetailModalProps) {
  const statusConfig = getStatusConfig(quote.status)
  const StatusIcon = statusConfig.icon
  const canRespond = quote.status === "pending_customer"
  const isAccepted = quote.status === "accepted"
  const cart = quote.cart
  const draftOrder = quote.draft_order
  const orderPreview = quoteWithPreview?.order_preview
  const currencyCode = draftOrder?.currency_code || "usd"

  // Build a map of original prices from cart items (what customer originally requested)
  const originalPriceMap = new Map<string, { unit_price: number; total: number }>()
  cart?.items?.forEach((item) => {
    // Match cart items to draft order items by variant_id
    if (item.variant_id) {
      originalPriceMap.set(item.variant_id, { 
        unit_price: item.unit_price, 
        total: item.total 
      })
    }
  })

  // For pending_customer: use preview items (admin's offer)
  // For accepted: use draft_order items (final accepted prices)
  const displayItems = canRespond 
    ? (orderPreview?.items || draftOrder?.items || [])
    : (draftOrder?.items || [])
  
  const displayTotal = canRespond 
    ? (orderPreview?.total ?? draftOrder?.total)
    : draftOrder?.total

  // Calculate savings: cart total (original) vs display total (quoted/accepted)
  const originalTotal = cart?.total || 0
  const quotedTotal = displayTotal ?? 0
  const totalSavings = originalTotal - quotedTotal
  const hasSavings = totalSavings > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Quote Details
            </h2>
            <p className="text-sm text-gray-500">
              {draftOrder?.display_id
                ? `Order #${draftOrder.display_id}`
                : `ID: ${quote.id.slice(0, 8)}...`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgClass}`}
            >
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
            <div className="text-sm text-gray-500">
              Created: {formatDate(quote.created_at)}
            </div>
          </div>

          {/* Totals */}
          {draftOrder && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {isLoadingPreview && (canRespond || quote.status === "accepted") ? (
                <div className="flex items-center justify-center py-2">
                  <div className="w-5 h-5 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {hasSavings && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Original Total</span>
                      <span className="text-gray-400 line-through">
                        {formatCurrency(originalTotal, currencyCode)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Quote Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(displayTotal, currencyCode)}
                    </span>
                  </div>
                  {hasSavings && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium text-green-700">Your Savings</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(totalSavings, currencyCode)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Items */}
          {displayItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
              {isLoadingPreview && (canRespond || quote.status === "accepted") ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                          Qty
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                          Unit Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {displayItems.map((item) => {
                        // Get variant_id from item or from nested variant object
                        const itemVariantId = (item as any).variant_id || (item as any).variant?.id
                        
                        // Get original price from cart items (matched by variant_id)
                        const originalData = itemVariantId ? originalPriceMap.get(itemVariantId) : undefined
                        const originalUnitPrice = originalData?.unit_price ?? item.unit_price
                        const hasDiscount = originalUnitPrice > item.unit_price
                        const itemSavings = hasDiscount
                          ? (originalUnitPrice - item.unit_price) * item.quantity
                          : 0

                        // Get product info from draft_order items (preview items don't have variant details)
                        const draftItem = draftOrder?.items?.find(i => i.id === item.id)
                        const thumbnail = draftItem?.thumbnail
                        const sku = draftItem?.variant?.sku

                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {thumbnail && (
                                  <img
                                    src={thumbnail}
                                    alt={item.title}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {item.title}
                                  </div>
                                  {sku && (
                                    <div className="text-sm text-gray-500">
                                      SKU: {sku}
                                    </div>
                                  )}
                                  {hasDiscount && (
                                    <div className="text-xs text-green-600 font-medium mt-0.5">
                                      Save {formatCurrency(itemSavings, currencyCode)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {hasDiscount ? (
                                <div>
                                  <div className="text-sm text-gray-400 line-through">
                                    {formatCurrency(originalUnitPrice, currencyCode)}
                                  </div>
                                  <div className="font-medium text-green-600">
                                    {formatCurrency(item.unit_price, currencyCode)}
                                  </div>
                                </div>
                              ) : (
                                <div className="font-medium text-gray-900">
                                  {formatCurrency(item.unit_price, currencyCode)}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Close
          </button>
          {canRespond && (
            <>
              <button
                onClick={onReject}
                disabled={isResponding}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                disabled={isResponding}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isResponding ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircleSolid className="w-4 h-4" />
                    Accept Quote
                  </>
                )}
              </button>
            </>
          )}
          {isAccepted && onViewOrder && (
            <button
              onClick={onViewOrder}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              View Order
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function QuotesPage() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, employee } = useAuth()
  const isAdmin = employee?.is_admin === true
  const { data: quotes, isLoading: quotesLoading } = useQuotes()
  const acceptMutation = useAcceptQuote()
  const rejectMutation = useRejectQuote()
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithRequestedBy | null>(null)

  // Fetch preview when a pending_customer or accepted quote is selected (to show savings)
  const shouldFetchPreview = selectedQuote?.status === "pending_customer" || selectedQuote?.status === "accepted"
  const { data: quoteWithPreview, isLoading: isLoadingPreview } = useQuotePreview(
    shouldFetchPreview ? selectedQuote?.id ?? "" : ""
  )

  const isResponding = acceptMutation.isPending || rejectMutation.isPending

  const handleAccept = (quoteId: string) => {
    acceptMutation.mutate(quoteId, {
      onSuccess: () => {
        toast.success("Quote accepted successfully")
        setSelectedQuote(null)
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to accept quote")
      },
    })
  }

  const handleReject = (quoteId: string) => {
    rejectMutation.mutate(quoteId, {
      onSuccess: () => {
        toast.success("Quote declined")
        setSelectedQuote(null)
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to decline quote")
      },
    })
  }

  const handleViewOrder = (orderId: string) => {
    setSelectedQuote(null)
    navigate({
      to: "/$countryCode/orders",
      params: { countryCode },
      search: { orderId },
    })
  }

  if (authLoading) {
    return (
      <DashboardPageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
        </div>
      </DashboardPageLayout>
    )
  }

  if (!isAuthenticated) {
    return (
      <DashboardPageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Please log in to view your quotes.</p>
        </div>
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quotes</h1>
          <p className="text-gray-600">
            {isAdmin ? "View and manage all company quote requests." : "View and manage your price quote requests."}
          </p>
        </div>
        <Link
          to="/$countryCode/store"
          params={{ countryCode }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
        >
          <DocumentText className="w-5 h-5" />
          Request Quote
        </Link>
      </div>

      {/* Quotes List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {quotesLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Quote
                  </th>
                  {isAdmin && (
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                      Requested By
                    </th>
                  )}
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Items
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Total
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                          <div className="h-3 w-32 bg-gray-200 rounded" />
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="h-6 w-24 bg-gray-200 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-12 bg-gray-200 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !quotes || quotes.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No quotes yet
            </h3>
            <p className="text-gray-500 mb-6">
              Request a quote from the product catalog to get custom pricing for
              your equipment needs.
            </p>
            <Link
              to="/$countryCode/store"
              params={{ countryCode }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Quote
                  </th>
                  {isAdmin && (
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                      Requested By
                    </th>
                  )}
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Items
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Total
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.map((quote: QuoteWithRequestedBy) => {
                  const statusConfig = getStatusConfig(quote.status)
                  const StatusIcon = statusConfig.icon
                  const itemCount = quote.draft_order?.items?.length || 0
                  const currencyCode =
                    quote.draft_order?.currency_code || "usd"
                  
                  // Calculate savings: cart (original request) vs final quoted price
                  // For pending_customer: use order_preview (admin's offer)
                  // For accepted: use draft_order (final accepted price)
                  const originalTotal = quote.cart?.total || 0
                  const quotedTotal = quote.status === "pending_customer" 
                    ? (quote.order_preview?.total ?? quote.draft_order?.total ?? 0)
                    : (quote.draft_order?.total ?? 0)
                  const savings = originalTotal - quotedTotal
                  const hasSavings = savings > 0

                  const actionItems: ActionMenuItem[] = [
                    {
                      label: "View Details",
                      icon: Eye,
                      onClick: () => setSelectedQuote(quote),
                    },
                  ]

                  if (quote.status === "accepted" && quote.draft_order_id) {
                    actionItems.push({
                      label: "View Order",
                      icon: ShoppingBag,
                      onClick: () => handleViewOrder(quote.draft_order_id),
                      variant: "primary",
                    })
                  }

                  return (
                    <tr
                      key={quote.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                            <DocumentText className="w-5 h-5 text-teal-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {quote.draft_order?.display_id
                              ? `#${quote.draft_order.display_id}`
                              : quote.id.slice(0, 8) + "..."}
                          </span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          {quote.requested_by ? (
                            <div>
                              <p className="font-medium text-gray-900">
                                {quote.requested_by.first_name} {quote.requested_by.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {quote.requested_by.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgClass}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4">
                        {hasSavings ? (
                          <div>
                            <div className="text-sm text-gray-400 line-through">
                              {formatCurrency(originalTotal, currencyCode)}
                            </div>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(quotedTotal, currencyCode)}
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                              Save {formatCurrency(savings, currencyCode)}
                            </div>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-900">
                            {formatCurrency(originalTotal, currencyCode)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(quote.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          <ActionMenu items={actionItems} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quote Detail Modal */}
      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          quoteWithPreview={quoteWithPreview}
          isLoadingPreview={isLoadingPreview}
          countryCode={countryCode}
          onClose={() => setSelectedQuote(null)}
          onAccept={() => handleAccept(selectedQuote.id)}
          onReject={() => handleReject(selectedQuote.id)}
          isResponding={isResponding}
          onViewOrder={selectedQuote.status === "accepted" && selectedQuote.draft_order_id 
            ? () => handleViewOrder(selectedQuote.draft_order_id)
            : undefined
          }
        />
      )}
    </DashboardPageLayout>
  )
}
