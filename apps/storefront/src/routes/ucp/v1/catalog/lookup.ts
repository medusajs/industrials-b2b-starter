import { readJsonBody, toResponse } from "@/lib/utils/ucp"
import { lookupCatalog } from "@/lib/utils/ucp-operations"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/ucp/v1/catalog/lookup")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        toResponse(await lookupCatalog(request, (await readJsonBody(request)) ?? {})),
    },
  },
})
