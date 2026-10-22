import { readJsonBody, toResponse } from "@/lib/utils/ucp"
import { createCheckout } from "@/lib/utils/ucp-operations"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/ucp/v1/checkout-sessions/")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        toResponse(
          await createCheckout(
            request,
            (await readJsonBody(request)) ?? {},
            request.headers.get("idempotency-key")
          )
        ),
    },
  },
})
