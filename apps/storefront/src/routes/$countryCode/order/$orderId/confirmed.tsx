import { createFileRoute, notFound } from "@tanstack/react-router"
import OrderConfirmationPage from "@/pages/order-confirmation"
import { retrieveOrder } from "@/lib/data/order"
import { queryKeys } from "@/lib/utils/query-keys"
import { sanitize } from "@/lib/utils/sanitize"

export const Route = createFileRoute("/$countryCode/order/$orderId/confirmed")({
  loader: async ({ params, context }) => {
    const { countryCode, orderId } = params
    const { queryClient } = context

    const order = await queryClient.ensureQueryData({
      queryKey: queryKeys.orders.detail(orderId),
      queryFn: () => retrieveOrder({ 
        order_id: orderId,
        fields: "+item_subtotal,+shipping_total,+discount_total,+tax_total,+total,*items,*items.variant,*items.product,*shipping_address,*billing_address,*shipping_methods,*payment_collections.payment_sessions"
      }),
    })

    if (!order) {
      throw notFound()
    }

    return sanitize({
      countryCode,
      order,
    })
  },
  component: OrderConfirmationPage,
})