import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { sanitize } from "@/lib/utils/sanitize"
import { STORE_NAME } from "@/lib/utils/site"
import Search from "@/pages/search"
import { createFileRoute, notFound } from "@tanstack/react-router"

const SEARCH_PAGE_SIZE = 24

export const Route = createFileRoute("/$countryCode/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string; page?: number } => {
    const q = typeof search.q === "string" ? search.q.trim().slice(0, 200) : ""
    const page = Number(search.page)

    return {
      q: q || undefined,
      page: Number.isInteger(page) && page > 1 ? page : undefined,
    }
  },
  loaderDeps: ({ search: { q, page } }) => ({ q, page }),
  loader: async ({ params, context, deps }) => {
    const { countryCode } = params
    const { queryClient } = context

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region) {
      throw notFound()
    }

    const page = deps.page ?? 1
    const { products, count, next_page } = await listProducts({
      page_param: page,
      query_params: {
        limit: SEARCH_PAGE_SIZE,
        q: deps.q,
        fields:
          "title,handle,thumbnail,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*categories",
      },
      region_id: region.id,
    })

    return sanitize({
      countryCode,
      region,
      query: deps.q ?? "",
      page,
      products,
      count,
      next_page,
    })
  },
  head: ({ loaderData }) => {
    const query = loaderData?.query
    const title = query
      ? `Search results for "${query}" | ${STORE_NAME}`
      : `Search equipment | ${STORE_NAME}`

    return {
      meta: [
        { title },
        { name: "description", content: `Search ${STORE_NAME}'s industrial equipment catalog.` },
      ],
    }
  },
  component: Search,
})
