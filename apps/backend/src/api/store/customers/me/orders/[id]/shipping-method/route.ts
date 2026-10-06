import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

type AddShippingMethodBody = {
  shipping_option_id: string
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AddShippingMethodBody>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const { id: orderId } = req.params
  const { shipping_option_id } = req.body || {}

  if (!shipping_option_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Shipping option ID is required"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Verify the order belongs to this customer and get currency
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "region_id", "currency_code", "shipping_methods.*"],
    filters: { id: orderId },
  })

  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }

  if (order.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You don't have access to this order"
    )
  }

  // Get shipping option details with prices
  const { data: [shippingOption] } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "price_type", "provider_id", "shipping_profile_id", "prices.*"],
    filters: { id: shipping_option_id },
  })

  if (!shippingOption) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Shipping option not found")
  }

  // Find the price for the order's currency
  const currencyCode = order.currency_code?.toLowerCase()
  const prices = (shippingOption as any).prices as Array<{ currency_code: string; amount: number }> | undefined
  const priceForCurrency = prices?.find(
    (p) => p.currency_code?.toLowerCase() === currencyCode
  )
  const shippingAmount = priceForCurrency?.amount ?? 0

  const orderModule = req.scope.resolve(Modules.ORDER)

  // Delete existing shipping methods before adding the new one
  const existingShippingMethods = (order as any).shipping_methods as Array<{ id: string }> | undefined
  if (existingShippingMethods?.length) {
    const idsToDelete = existingShippingMethods.map((sm) => sm.id)
    await orderModule.deleteOrderShippingMethods(idsToDelete)
  }
  
  // Add the new shipping method
  const shippingMethod = await orderModule.createOrderShippingMethods({
    order_id: orderId,
    name: shippingOption.name || "Shipping",
    shipping_option_id,
    amount: shippingAmount,
  })

  // Refetch order with shipping methods
  const { data: [updatedOrder] } = await query.graph({
    entity: "order",
    fields: ["id", "shipping_methods.*"],
    filters: { id: orderId },
  })

  res.json({ order: updatedOrder, shipping_method: shippingMethod })
}
