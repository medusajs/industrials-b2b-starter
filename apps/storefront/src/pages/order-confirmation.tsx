import { DashboardPageLayout } from "@/components/dashboard-page-layout"
import { Thumbnail } from "@/components/ui/thumbnail"
import { Price } from "@/components/ui/price"
import Address from "@/components/address"
import PaymentMethodInfo from "@/components/payment-method-info"
import { isPaidWithGiftCard } from "@/lib/utils/checkout"
import { formatOrderId } from "@/lib/utils/order"
import { useLoaderData, Link, useParams, getRouteApi } from "@tanstack/react-router"
import { CheckCircleSolid, ShoppingBag } from "@medusajs/icons"
import type { HttpTypes } from "@medusajs/types"

const routeApi = getRouteApi("/$countryCode/order/$orderId/confirmed")

const OrderConfirmation = () => {
  const { countryCode } = useParams({ strict: false })
  const { order } = routeApi.useLoaderData()

  if (!order) {
    return (
      <DashboardPageLayout>
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Order Not Found
          </h3>
          <p className="text-gray-500 mb-6">
            The order could not be found.
          </p>
          <Link
            to={"/$countryCode/store" as string} params={{ countryCode }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </DashboardPageLayout>
    )
  }

  const paidByGiftcard = isPaidWithGiftCard(order)

  return (
    <DashboardPageLayout>
      {/* Success Header */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircleSolid className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Order Confirmed
        </h1>
        <p className="text-gray-500">
          Thank you for your order! We've sent a confirmation to your email.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Order Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Order {formatOrderId(String(order.display_id ?? order.id ?? ""))}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Placed on{" "}
                {new Date(order.created_at!).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <CheckCircleSolid className="w-4 h-4" />
                Confirmed
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
          <div className="space-y-4">
            {order.items?.map((item: HttpTypes.StoreOrderLineItem) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <Thumbnail
                  thumbnail={item.thumbnail}
                  alt={item.product_title || item.title}
                  className="w-16 h-16"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.product_title}
                  </p>
                  {item.variant_title && item.variant_title !== "Default Variant" && (
                    <p className="text-sm text-gray-500">{item.variant_title}</p>
                  )}
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <Price
                    price={item.total}
                    currencyCode={order.currency_code}
                    className="font-medium"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <Price price={order.item_subtotal} currencyCode={order.currency_code} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <Price price={order.shipping_total} currencyCode={order.currency_code} />
            </div>
            {order.discount_total !== undefined && order.discount_total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <Price
                  price={order.discount_total}
                  currencyCode={order.currency_code}
                  type="discount"
                />
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <Price price={order.tax_total} currencyCode={order.currency_code} />
            </div>
            <hr className="border-gray-200 my-2" />
            <div className="flex justify-between font-semibold text-lg">
              <span className="text-gray-900">Total</span>
              <Price price={order.total} currencyCode={order.currency_code} />
            </div>
          </div>
        </div>

        {/* Shipping & Billing Info */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Shipping</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Address</h4>
                {order.shipping_address && (
                  <Address address={order.shipping_address} />
                )}
              </div>
              {order.shipping_methods?.[0] && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Method</h4>
                  <p className="text-gray-900">{order.shipping_methods[0].name}</p>
                  <Price
                    price={order.shipping_methods[0].amount}
                    currencyCode={order.currency_code}
                    className="text-sm text-gray-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Billing Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Billing</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Address</h4>
                {order.billing_address ? (
                  <Address address={order.billing_address} />
                ) : (
                  <p className="text-gray-500 text-sm">Same as shipping address</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Payment</h4>
                {order.payment_collections?.[0]?.payment_sessions?.[0] && (
                  <PaymentMethodInfo
                    provider_id={order.payment_collections[0].payment_sessions[0].provider_id}
                  />
                )}
                {paidByGiftcard && <span className="text-gray-900">Gift Card</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={"/$countryCode/orders" as string} params={{ countryCode }}
            className="inline-flex items-center justify-center px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-medium"
          >
            View All Orders
          </Link>
          <Link
            to={"/$countryCode/store" as string} params={{ countryCode }}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </DashboardPageLayout>
  )
}

export default OrderConfirmation
