import { getStorefrontUrl } from "@/lib/utils/site"
import { createFileRoute } from "@tanstack/react-router"

const UCP_VERSION = "2026-08-25"

export const Route = createFileRoute("/.well-known/ucp")({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = getStorefrontUrl()

        // TODO: Declare catalog, cart, checkout and order capabilities once a UCP shopping service exists.
        return Response.json(
          {
            ucp: {
              version: UCP_VERSION,
              services: {},
              capabilities: {
                "dev.ucp.shopping.permalink": [
                  {
                    version: UCP_VERSION,
                    spec: `https://ucp.dev/${UCP_VERSION}/specification/permalink`,
                    schema: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/permalink.json`,
                    config: {
                      endpoint: `${baseUrl}/buy`,
                    },
                  },
                ],
              },
              payment_handlers: {},
            },
          },
          {
            headers: {
              "Cache-Control": "public, max-age=3600",
            },
          }
        )
      },
    },
  },
})
