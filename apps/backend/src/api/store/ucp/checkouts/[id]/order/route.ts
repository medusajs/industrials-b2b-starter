import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/**
 * Returns the order placed from a completed cart, so UCP checkout sessions
 * (keyed by cart ID) can report the resulting order.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "completed_at", "order.id", "order.display_id"],
    filters: { id: req.params.id },
  })

  const order = carts[0]?.order
  if (!carts[0]?.completed_at || !order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "No order found for this checkout")
  }

  res.json({ order: { id: order.id, display_id: order.display_id } })
}
