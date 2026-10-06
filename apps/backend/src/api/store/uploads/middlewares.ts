import { z } from "@medusajs/framework/zod"
import {
  validateAndTransformBody,
  authenticate,
  type MiddlewareRoute,
} from "@medusajs/framework/http"

export const storeUploadsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/uploads",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      validateAndTransformBody(
        z.object({
          filename: z.string(),
          mime_type: z.string(),
          access: z.enum(["public", "private"]).optional(),
        })
      ),
    ],
  },
]
