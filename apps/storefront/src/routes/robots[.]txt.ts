import { getStorefrontUrl } from "@/lib/utils/site"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = getStorefrontUrl()
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /*/checkout",
          "Disallow: /*/account",
          "Disallow: /*/order",
          "Disallow: /*/orders",
          "Disallow: /*/quotes",
          "Disallow: /*/employees",
          "Disallow: /*/settings",
          "",
          `Sitemap: ${baseUrl}/sitemap.xml`,
          "",
        ].join("\n")

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        })
      },
    },
  },
})
