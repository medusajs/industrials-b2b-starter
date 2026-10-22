import { readJsonBody, toResponse } from "@/lib/utils/ucp"
import { cancelCart, getCart, updateCart } from "@/lib/utils/ucp-operations"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/ucp/v1/cart/$cartId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => toResponse(await getCart(request, params.cartId)),
      PUT: async ({ request, params }) =>
        toResponse(await updateCart(request, params.cartId, (await readJsonBody(request)) ?? {})),
      DELETE: async ({ request, params }) => toResponse(await cancelCart(request, params.cartId)),
    },
  },
})
