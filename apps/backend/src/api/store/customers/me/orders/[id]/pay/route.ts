import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { markPaymentCollectionAsPaid } from "@medusajs/medusa/core-flows"

type PayOrderRequestBody = {
  payment_collection_id?: string
}

export const POST = async (
  req: AuthenticatedMedusaRequest<PayOrderRequestBody>,
  res: MedusaResponse
) => {
  const { id: orderId } = req.params
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Customer not authenticated")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Get the order and verify it belongs to this customer
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "customer_id",
      "status",
      "payment_collections.id",
      "payment_collections.status",
      "payment_collections.amount",
    ],
    filters: { id: orderId },
  })

  const order = orders[0]

  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }

  if (order.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Order does not belong to this customer")
  }

  // Find the unpaid payment collection
  const paymentCollection = order.payment_collections?.find(
    (pc: any) => pc.status === "not_paid"
  )

  if (!paymentCollection) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No unpaid payment collection found for this order"
    )
  }

  // Mark the payment collection as paid
  const { result: payment } = await markPaymentCollectionAsPaid(req.scope).run({
    input: {
      payment_collection_id: paymentCollection.id,
      order_id: orderId,
    },
  })

  // Fetch the updated order
  const { data: updatedOrders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "status",
      "payment_collections.id",
      "payment_collections.status",
    ],
    filters: { id: orderId },
  })

  res.status(200).json({
    order: updatedOrders[0],
    payment,
  })
}
