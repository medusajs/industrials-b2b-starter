import handler, { createServerEntry } from "@tanstack/react-start/server-entry"

const acceptsHtml = (accept: string) =>
  accept.split(",").some((part) => /^\s*(\*\/\*|text\/html)/.test(part))

// Start answers page requests without text/html or */* in Accept with a 500, and request headers
// are read-only at runtime, so non-HTML GETs get a copy with a low-priority text/html added.
const withHtmlAccept = (request: Request) => {
  const accept = request.headers.get("accept") ?? "*/*"
  if ((request.method !== "GET" && request.method !== "HEAD") || acceptsHtml(accept)) {
    return request
  }
  const headers = new Headers(request.headers)
  headers.set("accept", `${accept}, text/html;q=0.1`)
  return new Request(request.url, { method: request.method, headers, signal: request.signal })
}

export default createServerEntry({
  fetch(request, opts) {
    return handler.fetch(withHtmlAccept(request), opts)
  },
})
