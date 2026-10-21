import { listRegions } from "@/lib/data/regions"
import { COUNTRY_CODE_KEY, getDefaultCountryCode } from "@/lib/utils/region"
import { sdk } from "@/lib/utils/sdk"
import { createFileRoute } from "@tanstack/react-router"

const MAX_LINE_ITEMS = 50
const MAX_QUANTITY = 10000
const ITEM_ID_PATTERN = /^[A-Za-z0-9._-]+$/
const QUANTITY_PATTERN = /^[1-9][0-9]*$/

const decodeItemId = (token: string): string | null => {
  if (!token.startsWith("~")) {
    return ITEM_ID_PATTERN.test(token) ? token : null
  }

  try {
    const decoded = Buffer.from(token.slice(1), "base64url").toString("utf8")
    return ITEM_ID_PATTERN.test(decoded) ? decoded : null
  } catch {
    return null
  }
}

const parseItems = (path: string) => {
  const quantities = new Map<string, number>()
  const tokens = path.split(",")

  if (!path || tokens.length > MAX_LINE_ITEMS) {
    return null
  }

  for (const token of tokens) {
    const [rawId, rawQuantity, ...rest] = token.split(":")
    const variantId = rawId ? decodeItemId(rawId) : null

    if (!variantId || rest.length || !QUANTITY_PATTERN.test(rawQuantity ?? "")) {
      return null
    }

    const quantity = (quantities.get(variantId) ?? 0) + Number(rawQuantity)

    if (quantity > MAX_QUANTITY) {
      return null
    }

    quantities.set(variantId, quantity)
  }

  return Array.from(quantities).map(([variant_id, quantity]) => ({ variant_id, quantity }))
}

const getCookieCountryCode = (request: Request) =>
  request.headers
    .get("cookie")
    ?.split("; ")
    .find((row) => row.startsWith(`${COUNTRY_CODE_KEY}=`))
    ?.split("=")[1]

const plainResponse = (message: string, status: number) =>
  new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  })

export const Route = createFileRoute("/buy/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const items = parseItems(params._splat ?? "")

        if (!items) {
          return plainResponse(
            "Invalid permalink. Expected /buy/{variant_id}:{quantity}[,{variant_id}:{quantity}]",
            400
          )
        }

        const regions = await listRegions({ fields: "id,*countries" })
        const requestedCountry = getCookieCountryCode(request)?.toLowerCase()
        const region =
          regions.find((r) => r.countries?.some((c) => c.iso_2 === requestedCountry)) ??
          regions.find((r) => r.countries?.some((c) => c.iso_2 === getDefaultCountryCode(regions)))
        const countryCode =
          region?.countries?.find((c) => c.iso_2 === requestedCountry)?.iso_2 ??
          getDefaultCountryCode(regions)

        if (!region || !countryCode) {
          return plainResponse("No region is configured for this store.", 503)
        }

        try {
          const { cart } = await sdk.store.cart.create(
            { region_id: region.id, items },
            { fields: "id" }
          )

          return new Response(null, {
            status: 303,
            headers: {
              Location: `/${countryCode}/cart?cart_id=${encodeURIComponent(cart.id)}`,
              "Cache-Control": "no-store",
              "Referrer-Policy": "no-referrer",
            },
          })
        } catch (error) {
          const status = (error as { status?: number }).status

          if (status && status >= 400 && status < 500) {
            return plainResponse(
              `One or more items in this permalink are unavailable in ${countryCode.toUpperCase()}.`,
              404
            )
          }

          throw error
        }
      },
    },
  },
})
