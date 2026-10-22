import { toResponse } from "@/lib/utils/ucp"
import { completeCheckout } from "@/lib/utils/ucp-operations"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/ucp/v1/checkout-sessions/$id/complete")({
  server: {
    handlers: {
      POST: async ({ request, params }) => toResponse(await completeCheckout(request, params.id)),
    },
  },
})
