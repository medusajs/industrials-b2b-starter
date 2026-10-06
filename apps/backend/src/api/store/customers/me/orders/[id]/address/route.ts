import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows"

type AddressInput = {
  first_name?: string
  last_name?: string
  company?: string
  address_1?: string
  address_2?: string
  city?: string
  postal_code?: string
  province?: string
  country_code?: string
  phone?: string
}

type UpdateOrderAddressBody = {
  shipping_address?: AddressInput
  billing_address?: AddressInput
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateOrderAddressBody>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const { id: orderId } = req.params
  const { shipping_address, billing_address } = req.body || {}

  if (!shipping_address && !billing_address) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "At least one address must be provided"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Verify the order belongs to this customer
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id"],
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

  // Update the order addresses using the updateOrderWorkflow
  await updateOrderWorkflow(req.scope).run({
    input: {
      id: orderId,
      user_id: customerId,
      ...(shipping_address && { shipping_address }),
      ...(billing_address && { billing_address }),
    },
  })

  // Refetch the updated order
  const { data: [updatedOrder] } = await query.graph({
    entity: "order",
    fields: ["id", "shipping_address.*", "billing_address.*"],
    filters: { id: orderId },
  })

  res.json({ order: updatedOrder })
}
