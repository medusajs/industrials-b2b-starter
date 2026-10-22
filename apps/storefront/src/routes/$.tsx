import { getStoredCountryCode } from "@/lib/data/country-code"
import { createFileRoute, notFound, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/$")({
  loader: async ({ params }) => {
    const path = params._splat ?? ""
    const [firstSegment] = path.split("/")

    if (
      !path ||
      firstSegment.length === 2 ||
      firstSegment.startsWith(".") ||
      firstSegment === "ucp"
    ) {
      throw notFound()
    }

    const { countryCode } = await getStoredCountryCode()

    throw redirect({ href: `/${countryCode}/${path}` })
  },
})
