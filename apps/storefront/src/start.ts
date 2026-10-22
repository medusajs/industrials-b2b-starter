import { renderProductMarkdown } from "@/lib/utils/product-markdown"
import { createMiddleware, createStart } from "@tanstack/react-start"
import handler from "@tanstack/react-start/server-entry"

const PRODUCT_PATH = /^\/([a-z]{2})\/products\/([^/.]+)\/?$/

const acceptsHtml = (accept: string) =>
  accept.split(",").some((part) => /^\s*(\*\/\*|text\/html)/.test(part))

const agentDiscoveryMiddleware = createMiddleware().server(async ({ next, request }) => {
  if (request.method === "GET" || request.method === "HEAD") {
    const { pathname } = new URL(request.url)
    const productMatch = pathname.match(PRODUCT_PATH)
    const accept = request.headers.get("accept") ?? "*/*"
    if (productMatch && accept.includes("text/markdown")) {
      return renderProductMarkdown(request, productMatch[1], productMatch[2])
    }
    // Start answers page requests without text/html or */* in Accept with a 500, and request
    // headers are read-only, so re-dispatch a copy that also accepts HTML.
    if (!acceptsHtml(accept)) {
      const headers = new Headers(request.headers)
      headers.set("accept", `${accept}, text/html;q=0.1`)
      return handler.fetch(
        new Request(request.url, { method: request.method, headers, signal: request.signal })
      )
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
