import { renderProductMarkdown } from "@/lib/utils/product-markdown"
import { createMiddleware, createStart } from "@tanstack/react-start"

const PRODUCT_PATH = /^\/([a-z]{2})\/products\/([^/.]+)\/?$/

const acceptsHtml = (accept: string) =>
  accept.split(",").some((part) => /^\s*(\*\/\*|text\/html)/.test(part))

const agentDiscoveryMiddleware = createMiddleware().server(async ({ next, request }) => {
  if (request.method === "GET") {
    const { pathname } = new URL(request.url)
    const productMatch = pathname.match(PRODUCT_PATH)
    const accept = request.headers.get("accept") ?? "*/*"
    if (productMatch && accept.includes("text/markdown")) {
      return renderProductMarkdown(request, productMatch[1], productMatch[2])
    }
    // TanStack Start answers page requests without text/html or */* in Accept with a 500.
    if (!acceptsHtml(accept)) {
      request.headers.set("accept", `${accept}, text/html;q=0.1`)
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
