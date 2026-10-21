import { createFileRoute, notFound } from "@tanstack/react-router"
import Cart from "@/pages/cart"
import { getRegion } from "@/lib/data/regions"

const CART_ID_PATTERN = /^cart_[A-Za-z0-9]+$/

export const Route = createFileRoute("/$countryCode/cart")({
  validateSearch: (search: Record<string, unknown>): { cart_id?: string } => ({
    cart_id:
      typeof search.cart_id === "string" && CART_ID_PATTERN.test(search.cart_id)
        ? search.cart_id
        : undefined,
  }),
  loader: async ({ params, context }) => {
    const { countryCode } = params
    const { queryClient } = context

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region) {
      throw notFound()
    }

    return {
      region,
      countryCode,
    }
  },
  component: Cart,
})