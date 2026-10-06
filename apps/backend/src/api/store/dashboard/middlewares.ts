import { authenticate, MiddlewareRoute } from "@medusajs/framework/http"

export const dashboardMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/dashboard/stats",
    method: ["GET"],
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
]
