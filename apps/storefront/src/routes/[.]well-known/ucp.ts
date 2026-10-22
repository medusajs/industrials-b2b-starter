import { getRequestOrigin } from "@/lib/utils/site"
import { UCP_CAPABILITIES, UCP_MCP_PATH, UCP_REST_BASE_PATH, UCP_VERSION } from "@/lib/utils/ucp"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/.well-known/ucp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = getRequestOrigin(request)

        const capabilities = Object.fromEntries(
          Object.entries(UCP_CAPABILITIES).map(([name, { spec, schema }]) => [
            name,
            [{ version: UCP_VERSION, spec, schema }],
          ])
        )

        const profile = {
          ucp: {
            version: UCP_VERSION,
            services: {
              "dev.ucp.shopping": [
                {
                  version: UCP_VERSION,
                  spec: `https://ucp.dev/${UCP_VERSION}/specification/overview/`,
                  transport: "mcp",
                  endpoint: `${origin}${UCP_MCP_PATH}`,
                  schema: `https://ucp.dev/${UCP_VERSION}/services/shopping/mcp.openrpc.json`,
                },
                {
                  version: UCP_VERSION,
                  spec: `https://ucp.dev/${UCP_VERSION}/specification/overview/`,
                  transport: "rest",
                  endpoint: `${origin}${UCP_REST_BASE_PATH}`,
                  schema: `https://ucp.dev/${UCP_VERSION}/services/shopping/rest.openapi.json`,
                },
              ],
            },
            capabilities: {
              ...capabilities,
              "dev.ucp.shopping.permalink": [
                {
                  version: UCP_VERSION,
                  spec: `https://ucp.dev/${UCP_VERSION}/specification/permalink`,
                  schema: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/permalink.json`,
                  config: { endpoint: `${origin}/buy` },
                },
              ],
            },
            payment_handlers: {},
          },
        }

        return Response.json(profile, {
          headers: {
            "Cache-Control": "public, max-age=300",
            "Access-Control-Allow-Origin": "*",
          },
        })
      },
    },
  },
})
