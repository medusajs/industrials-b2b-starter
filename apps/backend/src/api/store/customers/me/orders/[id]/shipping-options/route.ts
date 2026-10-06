import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const { id: orderId } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Verify the order belongs to this customer
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: [
      "id", 
      "customer_id", 
      "region_id",
      "currency_code",
      "shipping_address.country_code",
    ],
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

  // Get shipping options with their prices
  const { data: shippingOptionsData } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "price_type", "provider_id", "prices.*"],
  })

  const shippingOptions = shippingOptionsData.map((option: any) => {
    // Find the price for the order's currency
    const price = option.prices?.find(
      (p: any) => p.currency_code === order.currency_code
    )
    
    return {
      id: option.id,
      name: option.name,
      price_type: option.price_type,
      amount: price?.amount ?? 0,
      currency_code: order.currency_code,
      provider_id: option.provider_id,
    }
  })

  res.json({ shipping_options: shippingOptions })
}
