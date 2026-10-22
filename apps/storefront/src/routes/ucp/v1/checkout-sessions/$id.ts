import { readJsonBody, toResponse } from "@/lib/utils/ucp"
import { getCheckout, updateCheckout } from "@/lib/utils/ucp-operations"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/ucp/v1/checkout-sessions/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => toResponse(await getCheckout(request, params.id)),
      PUT: async ({ request, params }) =>
        toResponse(await updateCheckout(request, params.id, (await readJsonBody(request)) ?? {})),
    },
  },
})
