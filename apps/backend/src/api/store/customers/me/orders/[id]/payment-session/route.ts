import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createPaymentSessionsWorkflow } from "@medusajs/medusa/core-flows"

type InitPaymentSessionBody = {
  provider_id: string
}

export const POST = async (
  req: AuthenticatedMedusaRequest<InitPaymentSessionBody>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const { id: orderId } = req.params
  const { provider_id } = req.body || {}

  if (!provider_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Payment provider ID is required"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Verify the order belongs to this customer and get payment collection
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "payment_collections.*"],
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

  const paymentCollection = order.payment_collections?.[0]
  if (!paymentCollection) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No payment collection found for this order"
    )
  }

  // Create payment session
  const { result: paymentSessions } = await createPaymentSessionsWorkflow(req.scope).run({
    input: {
      payment_collection_id: paymentCollection.id,
      provider_id,
    },
  })

  // Refetch the payment collection
  const { data: [updatedOrder] } = await query.graph({
    entity: "order",
    fields: ["id", "payment_collections.*", "payment_collections.payment_sessions.*"],
    filters: { id: orderId },
  })

  res.json({ 
    payment_collection: updatedOrder?.payment_collections?.[0],
    payment_sessions: paymentSessions 
  })
}
