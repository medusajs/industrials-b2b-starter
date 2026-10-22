import { renderProductMarkdown } from "@/lib/utils/product-markdown"
import { createMiddleware, createStart } from "@tanstack/react-start"

const PRODUCT_PATH = /^\/([a-z]{2})\/products\/([^/.]+)\/?$/

const agentDiscoveryMiddleware = createMiddleware().server(async ({ next, request }) => {
  if (request.method === "GET") {
    const { pathname } = new URL(request.url)
    const productMatch = pathname.match(PRODUCT_PATH)
    if (productMatch && request.headers.get("accept")?.includes("text/markdown")) {
      return renderProductMarkdown(request, productMatch[1], productMatch[2])
    }
  }

  const result = await next()
  if (result.response.headers.get("content-type")?.includes("text/html")) {
    result.response.headers.append("Link", '</.well-known/ucp>; rel="ucp"')
  }
  return result
})

export const startInstance = createStart(() => ({
  requestMiddleware: [agentDiscoveryMiddleware],
}))
