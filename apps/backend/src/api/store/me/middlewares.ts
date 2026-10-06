import { MiddlewareRoute, authenticate } from "@medusajs/framework/http"

export const meMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/me",
    method: "GET",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
]
