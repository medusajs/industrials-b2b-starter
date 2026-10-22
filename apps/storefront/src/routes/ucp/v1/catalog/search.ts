import { readJsonBody, toResponse } from "@/lib/utils/ucp"
import { searchCatalog } from "@/lib/utils/ucp-operations"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/ucp/v1/catalog/search")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        toResponse(await searchCatalog(request, (await readJsonBody(request)) ?? {})),
    },
  },
})
