import { listCategories } from "@/lib/data/categories"
import { listProducts } from "@/lib/data/products"
import { getRegion, listRegions } from "@/lib/data/regions"
import { queryKeys } from "@/lib/utils/query-keys"
import { sanitize } from "@/lib/utils/sanitize"
import { getStorefrontUrl, listCountryCodes, STORE_NAME } from "@/lib/utils/site"
import { buildRegionsReturnPolicies } from "@/lib/utils/store-policies"
import { HttpTypes } from "@medusajs/types"
import { QueryClient } from "@tanstack/react-query"
import { notFound } from "@tanstack/react-router"

const HOME_CATEGORY_PARAMS = { include_ancestors_tree: false }

export type HomeLoaderData = {
  countryCode: string
  region: HttpTypes.StoreRegion
  returnPolicies: Record<string, unknown>[]
  countryCodes: string[]
}

export const HOME_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
}

export const loadHome = async (
  countryCode: string,
  queryClient: QueryClient
) => {
  const region = await queryClient.ensureQueryData({
    queryKey: ["region", countryCode],
    queryFn: () => getRegion({ country_code: countryCode }),
  })

  if (!region) {
    throw notFound()
  }

  const [regions] = await Promise.all([
    listRegions(),
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
}

export const buildHomeHead = (loaderData: HomeLoaderData | undefined) => {
  const countryCode = loaderData?.countryCode
  const storefrontUrl = getStorefrontUrl()
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: STORE_NAME,
    url: `${storefrontUrl}/${countryCode}`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${storefrontUrl}/${countryCode}/search?q={search_term_string}`,
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
      { rel: "canonical", href: `${storefrontUrl}/${countryCode}` },
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
}
