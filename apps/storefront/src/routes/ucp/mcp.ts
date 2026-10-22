import { handleMcpRequest } from "@/lib/utils/ucp-mcp"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/ucp/mcp")({
  server: {
    handlers: {
      POST: ({ request }) => handleMcpRequest(request),
      GET: () => new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } }),
    },
  },
})
