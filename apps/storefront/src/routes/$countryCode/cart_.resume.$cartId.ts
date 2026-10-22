import { cartCookie } from "@/lib/utils/server-cart"
import { sdk } from "@/lib/utils/sdk"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/$countryCode/cart_/resume/$cartId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }
        try {
          const { cart } = await sdk.store.cart.retrieve(params.cartId, {
            fields: "id,completed_at,metadata",
          })
          if (cart.completed_at || cart.metadata?.ucp_canceled === true) {
            throw new Error("Cart is no longer open")
          }
        } catch {
          return new Response("This cart link has expired", { status: 410, headers })
        }

        return new Response(null, {
          status: 303,
          headers: {
            ...headers,
            Location: `/${params.countryCode}/cart`,
            "Set-Cookie": cartCookie(params.cartId),
          },
        })
      },
    },
  },
})
