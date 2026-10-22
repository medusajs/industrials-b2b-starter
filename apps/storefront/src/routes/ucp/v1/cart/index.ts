import { readJsonBody, toResponse } from "@/lib/utils/ucp"
import { createCart } from "@/lib/utils/ucp-operations"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/ucp/v1/cart/")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        toResponse(
          await createCart(
            request,
            (await readJsonBody(request)) ?? {},
            request.headers.get("idempotency-key")
          )
        ),
    },
  },
})
