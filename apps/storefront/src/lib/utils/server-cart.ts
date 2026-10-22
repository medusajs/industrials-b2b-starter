import { listRegions } from "@/lib/data/regions"
import { CART_KEY } from "@/lib/utils/cart"
import { COUNTRY_CODE_KEY, getDefaultCountryCode } from "@/lib/utils/region"
import { sdk } from "@/lib/utils/sdk"
import { HttpTypes } from "@medusajs/types"

const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const readCookie = (request: Request, name: string) =>
  request.headers
    .get("cookie")
    ?.split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1] || undefined

export const cartCookie = (cartId: string) =>
  `${CART_KEY}=${cartId}; Path=/; Max-Age=${CART_COOKIE_MAX_AGE}; SameSite=Lax`

/**
 * Resolves the region for a server request from an explicit country code, the
 * stored country cookie, or the store's default country, in that order.
 */
export const resolveRequestRegion = async (
  request: Request,
  explicitCountryCode?: string
): Promise<{ countryCode: string; region: HttpTypes.StoreRegion } | null> => {
  const regions = await listRegions({ fields: "id,currency_code,metadata,*countries" })
  const candidates = [
    explicitCountryCode?.toLowerCase(),
    readCookie(request, COUNTRY_CODE_KEY),
    getDefaultCountryCode(regions),
  ]

  for (const countryCode of candidates) {
    if (!countryCode) continue
    const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === countryCode))
    if (region) return { countryCode, region }
    if (countryCode === explicitCountryCode?.toLowerCase()) return null
  }
  return null
}

export const createCartWithItems = async (
  regionId: string,
  items: { variant_id: string; quantity: number }[]
) => {
  const { cart } = await sdk.store.cart.create({ region_id: regionId, items }, { fields: "id" })
  return cart.id
}
