import { getRegion } from "@/lib/data/regions"
import { CART_KEY } from "@/lib/utils/cart"
import { cartCookie, readCookie } from "@/lib/utils/server-cart"
import { sdk } from "@/lib/utils/sdk"
import { createFileRoute } from "@tanstack/react-router"

const MAX_LINE_ITEMS = 50
const MAX_QUANTITY = 10000

const parseLineItems = (form: FormData) => {
  const variantIds = form.getAll("variant_id").map(String)
  const quantities = form.getAll("quantity").map((value) => parseInt(String(value), 10))

  if (!variantIds.length || variantIds.length > MAX_LINE_ITEMS) {
    return null
  }

  return variantIds
    .map((variant_id, index) => ({ variant_id, quantity: quantities[index] ?? 1 }))
    .filter(
      ({ variant_id, quantity }) =>
        variant_id && Number.isInteger(quantity) && quantity > 0 && quantity <= MAX_QUANTITY
    )
}

const addLineItems = async (
  cartId: string | undefined,
  regionId: string,
  items: { variant_id: string; quantity: number }[]
) => {
  if (!cartId) {
    const { cart } = await sdk.store.cart.create({ region_id: regionId, items }, { fields: "id" })
    return cart.id
  }
  for (const item of items) {
    await sdk.store.cart.createLineItem(cartId, item, { fields: "id" })
  }
  return cartId
}

export const Route = createFileRoute("/$countryCode/cart_/add")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const region = await getRegion({ country_code: params.countryCode })
        if (!region) {
          return new Response("Unknown country code", { status: 404 })
        }

        const items = parseLineItems(await request.formData())
        if (!items?.length) {
          return new Response("Choose at least one variant with a quantity of 1 or more", {
            status: 400,
          })
        }

        const existingCartId = readCookie(request, CART_KEY)
        let cartId: string
        try {
          cartId = await addLineItems(existingCartId, region.id, items)
        } catch (error) {
          if (!existingCartId) {
            return new Response(
              error instanceof Error ? error.message : "Could not add items to cart",
              { status: 400 }
            )
          }
          // The stored cart may be completed or belong to another region.
          try {
            cartId = await addLineItems(undefined, region.id, items)
          } catch (retryError) {
            return new Response(
              retryError instanceof Error ? retryError.message : "Could not add items to cart",
              { status: 400 }
            )
          }
        }

        return new Response(null, {
          status: 303,
          headers: {
            Location: `/${params.countryCode}/cart`,
            "Set-Cookie": cartCookie(cartId),
          },
        })
      },
    },
  },
})
