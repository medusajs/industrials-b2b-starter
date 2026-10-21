import { listCategories } from "@/lib/data/categories"
import { listAllProducts } from "@/lib/data/products"
import { listRegions } from "@/lib/data/regions"
import { POLICY_PAGES } from "@/lib/constants/policy-pages"
import { getStorefrontUrl } from "@/lib/utils/site"
import { createFileRoute } from "@tanstack/react-router"

const toDate = (value?: string | Date | null) =>
  value ? new Date(value).toISOString() : undefined

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = getStorefrontUrl()

        const [regions, products, categories] = await Promise.all([
          listRegions({ fields: "*countries" }),
          listAllProducts({ fields: "handle,updated_at" }),
          listCategories({ fields: "handle,updated_at" }),
        ])

        const countryCodes = regions.flatMap(
          (region) => region.countries?.map((country) => country.iso_2) ?? []
        )

        const entries: { path: string; lastmod?: string }[] = []

        for (const countryCode of countryCodes) {
          entries.push({ path: `/${countryCode}` }, { path: `/${countryCode}/store` })
          for (const product of products) {
            entries.push({
              path: `/${countryCode}/products/${product.handle}`,
              lastmod: toDate(product.updated_at),
            })
          }
          for (const category of categories) {
            entries.push({
              path: `/${countryCode}/categories/${category.handle}`,
              lastmod: toDate(category.updated_at),
            })
          }
          for (const policy of POLICY_PAGES) {
            entries.push({ path: `/${countryCode}/${policy.handle}` })
          }
        }

        const urls = entries
          .map(({ path, lastmod }) =>
            [
              "  <url>",
              `    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>`,
              lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
              "  </url>",
            ]
              .filter(Boolean)
              .join("\n")
          )
          .join("\n")

        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        })
      },
    },
  },
})
