import { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/utils/sdk"
import { setStoredCart } from "@/lib/utils/cart"
import { sendPostRequest } from "@/lib/data/custom"

export const listCustomerOrders = async ({
  fields,
}: {
  fields?: string;
}): Promise<HttpTypes.StoreOrder[]> => {
  const { orders } = await sdk.store.order.list({ fields })
  return orders
}

export const retrieveOrder = async ({
  order_id,
  fields,
}: {
  order_id: string;
  fields?: string;
}): Promise<HttpTypes.StoreOrder | null> => {
  const { order } = await sdk.store.order.retrieve(order_id, { fields })
  return order
}

/**
 * Reorders an existing order by creating a new cart with the same items,
 * addresses, and shipping method.
 * 
 * @param order_id - The ID of the order to reorder
 * @returns Promise that resolves to the newly created cart
 * 
 * @example
 * ```typescript
 * const cart = await reorder({ order_id: 'order_123' });
 * // Cart is now set as the active cart and customer can proceed to checkout
 * ```
 */
export const reorder = async ({
  order_id,
}: {
  order_id: string;
}): Promise<HttpTypes.StoreCart> => {
  const { cart } = await sendPostRequest<{ cart: HttpTypes.StoreCart }>(
    `/store/customers/me/orders/${order_id}/reorder`
  )

  // Set the new cart as the active cart
  setStoredCart(cart.id)

  return cart
}