import Home from "@/pages/home"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { getRegion, listRegions } from "@/lib/data/regions"
import { buildRegionsReturnPolicies } from "@/lib/utils/store-policies"
import { listProducts } from "@/lib/data/products"
import { listCategories } from "@/lib/data/categories"
import { queryKeys } from "@/lib/utils/query-keys"
import { sanitize } from "@/lib/utils/sanitize"
import { getStorefrontUrl, listCountryCodes, STORE_NAME } from "@/lib/utils/site"

const HOME_CATEGORY_PARAMS = { include_ancestors_tree: false }

export const Route = createFileRoute("/$countryCode/")({
  loader: async ({ params, context }) => {
    const { countryCode } = params
    const { queryClient } = context

    // Fetch region for the country code
    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region) {
      throw notFound()
    }

    const [regions] = await Promise.all([
      listRegions({ fields: "id,metadata,*countries" }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.products.latest(4, region.id),
        queryFn: () =>
          listProducts({
            query_params: {
              limit: 4,
              order: "-created_at",
            },
            region_id: region.id,
          }),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.categories.list(undefined, HOME_CATEGORY_PARAMS),
        queryFn: () => listCategories({ queryParams: HOME_CATEGORY_PARAMS }),
      }),
    ])

    return sanitize({
      countryCode,
      region,
      returnPolicies: buildRegionsReturnPolicies(regions),
      countryCodes: listCountryCodes(regions),
    })
  },
  headers: () => ({
    "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
  }),
  head: ({ params, loaderData }) => {
    const storefrontUrl = getStorefrontUrl()
    const websiteData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: STORE_NAME,
      url: `${storefrontUrl}/${params.countryCode}`,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${storefrontUrl}/${params.countryCode}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    }
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: STORE_NAME,
      url: storefrontUrl,
      logo: `${storefrontUrl}/images/prolift-favicon.svg`,
      ...(loaderData?.returnPolicies?.length && {
        hasMerchantReturnPolicy: loaderData.returnPolicies,
      }),
    }
    const title = `ProLift Equipment | Industrial Lifting Solutions`
    const description = `Discover ProLift's curated collection of industrial equipment, forklift parts, and warehouse solutions. Browse our latest products and shop with confidence.`

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
      links: [
        { rel: "canonical", href: `${storefrontUrl}/${params.countryCode}` },
        ...(loaderData?.countryCodes ?? []).map((code: string) => ({
          rel: "alternate",
          hrefLang: `en-${code.toUpperCase()}`,
          href: `${storefrontUrl}/${code}`,
        })),
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(websiteData) },
        { type: "application/ld+json", children: JSON.stringify(organizationData) },
      ],
    }
  },
  component: Home,
})
