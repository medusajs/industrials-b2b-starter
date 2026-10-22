import { toResponse } from "@/lib/utils/ucp"
import { cancelCheckout } from "@/lib/utils/ucp-operations"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/ucp/v1/checkout-sessions/$id/cancel")({
  server: {
    handlers: {
      POST: async ({ request, params }) => toResponse(await cancelCheckout(request, params.id)),
    },
  },
})
