import { renderProductMarkdown } from "@/lib/utils/product-markdown"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/$countryCode/products/{$handle}.md")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        renderProductMarkdown(request, params.countryCode, params.handle),
    },
  },
})
