import { createIsomorphicFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

export const STORE_NAME = "ProLift Equipment"

const configuredUrl = (import.meta.env.VITE_STOREFRONT_URL as string | undefined)?.replace(
  /\/+$/,
  ""
)

export const getRequestOrigin = (request: Request): string => {
  if (configuredUrl) return configuredUrl

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim()
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || "https"
    return `${proto}://${forwardedHost}`
  }
  return new URL(request.url).origin
}

export const getStorefrontUrl = createIsomorphicFn()
  .server(() => getRequestOrigin(getRequest()))
  .client(() => configuredUrl || window.location.origin)

export const listCountryCodes = (
  regions: { countries?: { iso_2?: string | null }[] | null }[]
): string[] =>
  regions.flatMap((region) =>
    (region.countries ?? [])
      .map((country) => country.iso_2?.toLowerCase())
      .filter((code): code is string => Boolean(code))
  )
