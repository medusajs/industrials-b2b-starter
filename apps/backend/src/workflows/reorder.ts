import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  addShippingMethodToCartWorkflow,
  createCartWorkflow,
  listShippingOptionsForCartWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

type ReorderWorkflowInput = {
  order_id: string
}

export const reorderWorkflow = createWorkflow(
  "reorder",
  ({ order_id }: ReorderWorkflowInput) => {
    // Fetch the order with all necessary details
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "*",
        "items.*",
        "shipping_address.*",
        "billing_address.*",
        "region.*",
        "sales_channel.*",
        "shipping_methods.*",
        "customer.*",
      ],
      filters: {
        id: order_id,
      },
    })

    // Prepare cart creation input from order data
    const createInput = transform({ orders }, (data) => {
      const order = data.orders[0]
      return {
        region_id: order.region_id!,
        sales_channel_id: order.sales_channel_id!,
        customer_id: order.customer_id!,
        email: order.email!,
        billing_address: order.billing_address
          ? {
              first_name: order.billing_address.first_name!,
              last_name: order.billing_address.last_name!,
              address_1: order.billing_address.address_1!,
              city: order.billing_address.city!,
              country_code: order.billing_address.country_code!,
              province: order.billing_address.province ?? undefined,
              postal_code: order.billing_address.postal_code ?? undefined,
              phone: order.billing_address.phone ?? undefined,
            }
          : undefined,
        shipping_address: order.shipping_address
          ? {
              first_name: order.shipping_address.first_name!,
              last_name: order.shipping_address.last_name!,
              address_1: order.shipping_address.address_1!,
              city: order.shipping_address.city!,
              country_code: order.shipping_address.country_code!,
              province: order.shipping_address.province ?? undefined,
              postal_code: order.shipping_address.postal_code ?? undefined,
              phone: order.shipping_address.phone ?? undefined,
            }
          : undefined,
        items: order.items?.map((item: any) => ({
          variant_id: item.variant_id!,
          quantity: item.quantity!,
          unit_price: item.unit_price!,
        })),
      }
    })

    // Create the cart with order data
    const { id: cart_id } = createCartWorkflow.runAsStep({
      input: createInput,
    })

    // List available shipping options for the cart
    const availableShippingOptions = listShippingOptionsForCartWorkflow.runAsStep({
      input: { cart_id },
    })

    // Validate and prepare shipping method input - only add if original option is still valid
    const validatedShippingInput = transform(
      { cart_id, orders, availableShippingOptions },
      (data) => {
        const order = data.orders[0]
        const availableOptionIds = new Set(
          data.availableShippingOptions.map((opt: any) => opt.id)
        )

        // Filter to only shipping options that are still valid for this cart
        const validOptions =
          order.shipping_methods
            ?.filter((method: any) =>
              availableOptionIds.has(method.shipping_option_id)
            )
            .map((method: any) => ({
              id: method.shipping_option_id!,
              data: method.data || {},
            })) ?? []

        return {
          cart_id: data.cart_id,
          options: validOptions,
          hasValidOptions: validOptions.length > 0,
        }
      }
    )

    // Only add shipping method if we have valid options
    when(validatedShippingInput, (input) => input.hasValidOptions).then(() => {
      addShippingMethodToCartWorkflow.runAsStep({
        input: validatedShippingInput,
      })
    })

    // Retrieve and return the fully populated cart
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      fields: [
        "*",
        "items.*",
        "shipping_methods.*",
        "shipping_address.*",
        "billing_address.*",
        "region.*",
        "sales_channel.*",
        "promotions.*",
        "currency_code",
        "subtotal",
        "item_total",
        "total",
        "item_subtotal",
        "shipping_subtotal",
        "customer.*",
        "payment_collection.*",
      ],
      filters: {
        id: cart_id,
      },
    }).config({ name: "retrieve-cart" })

    return new WorkflowResponse(carts[0])
  }
)
