import { listCategories } from "@/lib/data/categories"
import { listRegions } from "@/lib/data/regions"
import { POLICY_PAGES } from "@/lib/constants/policy-pages"
import { getDefaultCountryCode } from "@/lib/utils/region"
import { getStorefrontUrl, STORE_NAME } from "@/lib/utils/site"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = getStorefrontUrl()

        const [regions, categories] = await Promise.all([
          listRegions({ fields: "name,currency_code,*countries" }),
          listCategories({ fields: "name,handle" }),
        ])

        const countryCode = getDefaultCountryCode(regions)
        const shopUrl = `${baseUrl}/${countryCode}`
        const currencies = Array.from(
          new Set(regions.map((region) => region.currency_code?.toUpperCase()))
        )
          .filter(Boolean)
          .join(", ")
        const countries = regions
          .flatMap((region) => region.countries?.map((country) => country.iso_2) ?? [])
          .join(", ")

        const body = [
          `# ${STORE_NAME}`,
          "",
          `> B2B supplier of industrial material handling equipment: forklifts, reach trucks and parts. Ships to: ${countries}. Prices in ${currencies}.`,
          "",
          "Pricing is shown to signed-in business accounts. Product details and availability are public. Replace the country code in any URL to shop another region.",
          "",
          "## Shop",
          `- [All equipment](${shopUrl}/store)`,
          ...categories.map(
            (category) => `- [${category.name}](${shopUrl}/categories/${category.handle})`
          ),
          `- Search: ${shopUrl}/search?q={query}`,
          "",
          "## Policies",
          ...POLICY_PAGES.map((policy) => `- [${policy.title}](${shopUrl}/${policy.handle})`),
          "",
          "## For agents",
          `- [Sitemap](${baseUrl}/sitemap.xml)`,
          `- [UCP profile](${baseUrl}/.well-known/ucp)`,
          `- Cart permalink: ${baseUrl}/buy/{variant_id}:{quantity},{variant_id}:{quantity}`,
          "",
        ].join("\n")

        return new Response(body, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        })
      },
    },
  },
})
