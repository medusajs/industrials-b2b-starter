import { createFileRoute, notFound } from "@tanstack/react-router"
import { getRegion } from "@/lib/data/regions"
import Store from "@/pages/store"
import { sanitize } from "@/lib/utils/sanitize"

export const Route = createFileRoute("/$countryCode/store")({
  validateSearch: (search: Record<string, unknown>) => search,
  loader: async ({ params, context }) => {
    const { countryCode } = params
    const { queryClient } = context

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region) {
      throw notFound()
    }

    return sanitize({
      countryCode,
      region,
    })
  },
  head: ({ loaderData }) => {
    const { region, countryCode } = loaderData || {}
    const regionName = region?.name || countryCode?.toUpperCase()
    const title = `Shop All Products - ${regionName} | ProLift Equipment`
    const description = `Browse ProLift's complete collection of industrial equipment and parts available in ${regionName}.`

    return {
      meta: [
        {
          title,
        },
        {
          name: "description",
          content: description,
        },
        {
          property: "og:title",
          content: title,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "twitter:card",
          content: "summary_large_image",
        },
        {
          property: "twitter:title",
          content: title,
        },
        {
          property: "twitter:description",
          content: description,
        },
      ],
    }
  },
  component: Store,
})
