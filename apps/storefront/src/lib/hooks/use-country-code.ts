import { useLoaderData, useParams } from "@tanstack/react-router"

/** The URL's country code, or the store's default country on routes without one (such as `/`). */
export const useCountryCode = (): string => {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const { defaultCountryCode } = useLoaderData({ from: "__root__" })
  return params.countryCode || defaultCountryCode || "us"
}
