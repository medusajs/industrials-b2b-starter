import { getStoredCountryCode } from "@/lib/data/country-code"
import { buildHomeHead, loadHome } from "@/lib/data/home"
import { listRegions } from "@/lib/data/regions"
import { getDefaultCountryCode } from "@/lib/utils/region"
import Home from "@/pages/home"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const [{ countryCode }, regions] = await Promise.all([getStoredCountryCode(), listRegions()])

    if (countryCode !== getDefaultCountryCode(regions)) {
      throw redirect({ to: "/$countryCode", params: { countryCode } })
    }

    return loadHome(countryCode, context.queryClient)
  },
  // The response depends on the visitor's country cookie, so shared caches must not store it.
  headers: () => ({ "Cache-Control": "private, no-cache" }),
  head: ({ loaderData }) => buildHomeHead(loaderData),
  component: Home,
})
