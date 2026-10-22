import { ProductCard } from "@/components/product-card"
import { PublicProductCard } from "@/components/public-product-card"
import { useAuth } from "@/lib/hooks/use-auth"
import { webMcpTool } from "@/lib/utils/webmcp"
import { HttpTypes } from "@medusajs/types"
import { MagnifyingGlass } from "@medusajs/icons"
import { Link, useLoaderData } from "@tanstack/react-router"

interface SearchPageData {
  countryCode: string
  region: HttpTypes.StoreRegion
  query: string
  page: number
  products: HttpTypes.StoreProduct[]
  count: number
  next_page: number | null
}

export default function SearchPage() {
  const { countryCode, region, query, page, products, count, next_page } = useLoaderData({
    from: "/$countryCode/search",
  }) as SearchPageData
  const { isAuthenticated } = useAuth()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {query ? `Search results for "${query}"` : "Search equipment"}
      </h1>

      <form
        role="search"
        method="get"
        action={`/${countryCode}/search`}
        className="flex gap-3 mb-8 max-w-2xl"
        {...webMcpTool("search_products", "Search the equipment catalog by keyword.")}
      >
        <label htmlFor="search-page-q" className="sr-only">
          Search equipment
        </label>
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="search-page-q"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search equipment..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      <p className="text-sm text-gray-500 mb-6" aria-live="polite">
        {count} {count === 1 ? "product" : "products"} found
      </p>

      {products.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <li key={product.id}>
              {isAuthenticated ? (
                <ProductCard product={product} regionId={region.id} countryCode={countryCode} />
              ) : (
                <PublicProductCard product={product} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">
            No equipment matches your search. Try a different keyword or browse the full catalog.
          </p>
          <Link
            to="/$countryCode/store"
            params={{ countryCode }}
            className="inline-flex px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
          >
            Browse all equipment
          </Link>
        </div>
      )}

      {(page > 1 || next_page) && (
        <nav aria-label="Search results pages" className="flex justify-between mt-10">
          {page > 1 ? (
            <Link
              to="/$countryCode/search"
              params={{ countryCode }}
              search={{ q: query || undefined, page: page - 1 > 1 ? page - 1 : undefined }}
              className="text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Previous page
            </Link>
          ) : (
            <span />
          )}
          {next_page && (
            <Link
              to="/$countryCode/search"
              params={{ countryCode }}
              search={{ q: query || undefined, page: next_page }}
              className="text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Next page
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
