import { ProductCard } from "@/components/product-card"
import { PublicProductCard } from "@/components/public-product-card"
import { SearchPagination } from "@/components/search/search-pagination"
import { useSearchProducts } from "@/lib/hooks/use-search-products"
import { useSearchSettled } from "@/lib/hooks/use-search-settled"
import { MagnifyingGlass } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { useHits, useInstantSearch } from "react-instantsearch"

const GRID_CLASSES =
  "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"

const SKELETON_COUNT = 12

type ProductSearchResultsProps = {
  variant: "public" | "authenticated"
  countryCode: string
  region?: HttpTypes.StoreRegion
  hasInput: boolean
  isPending: boolean
  query: string
  onClearSearch: () => void
}

const ResultsSkeleton = () => (
  <div className={GRID_CLASSES} data-testid="search-results-loading">
    {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
      <div
        key={index}
        className="bg-surface rounded-lg border border-border overflow-hidden animate-pulse"
      >
        <div className="aspect-[4/3] bg-gray-200" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-5 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
)

const ErrorPanel = ({
  title,
  message,
  testId,
}: {
  title: string
  message?: string
  testId: string
}) => (
  <div
    className="text-center py-16 bg-surface rounded-lg border border-border"
    data-testid={testId}
  >
    <h3 className="text-base font-semibold text-error mb-1">{title}</h3>
    {message && (
      <p className="text-sm text-text-secondary break-words px-6">{message}</p>
    )}
  </div>
)

export const SearchResultsCount = () => {
  const { results } = useInstantSearch()
  const { hasNoResultsYet } = useSearchSettled()
  const nbHits = results?.nbHits ?? 0

  if (hasNoResultsYet) {
    return null
  }

  return (
    <p className="text-sm text-text-secondary" data-testid="search-results-count">
      {results?.exhaustiveNbHits === false ? "About " : ""}
      {nbHits} {nbHits === 1 ? "product" : "products"}
    </p>
  )
}

export const ProductSearchResults = ({
  variant,
  countryCode,
  region,
  hasInput,
  isPending,
  query,
  onClearSearch,
}: ProductSearchResultsProps) => {
  const { items } = useHits()
  const { status, error, results } = useInstantSearch()
  const { hasNoResultsYet, isSettled, resultsQuery } = useSearchSettled()

  const isEmptyQueryLeftover = hasInput && !resultsQuery

  const hitIds = isEmptyQueryLeftover
    ? []
    : items.map((hit) => String(hit.objectID))

  const productsQuery = useSearchProducts({
    ids: hitIds,
    region_id: region?.id,
  })

  const products = isEmptyQueryLeftover ? [] : (productsQuery.data ?? [])
  const hasProducts = products.length > 0

  const searchFailed = status === "error"
  const hydrationFailed = !searchFailed && productsQuery.isError

  const isWaiting =
    !hasProducts &&
    !searchFailed &&
    !hydrationFailed &&
    (hasNoResultsYet ||
      isEmptyQueryLeftover ||
      hitIds.length > 0 ||
      productsQuery.isLoading)

  if (searchFailed) {
    return (
      <ErrorPanel
        title="Couldn't search products."
        message={error?.message}
        testId="search-error"
      />
    )
  }

  if (hydrationFailed) {
    return (
      <ErrorPanel
        title="Couldn't load these products."
        message={
          productsQuery.error instanceof Error
            ? productsQuery.error.message
            : undefined
        }
        testId="search-products-error"
      />
    )
  }

  const body = () => {
    if (hasProducts) {
      return (
        <div className={GRID_CLASSES} data-testid="search-results">
          {products.map((product, index) =>
            variant === "public" ? (
              <PublicProductCard
                key={product.id}
                product={product}
                isNew={(results?.page ?? 0) === 0 && index < 2}
              />
            ) : (
              <ProductCard
                key={product.id}
                product={product}
                regionId={region?.id || ""}
                countryCode={countryCode}
              />
            )
          )}
        </div>
      )
    }

    if (isWaiting) {
      return <ResultsSkeleton />
    }

    if (!isSettled || isPending) {
      return null
    }

    return <NoResults query={query} onClearSearch={onClearSearch} />
  }

  return (
    <>
      {body()}
      <SearchPagination isExactCount={results?.exhaustiveNbHits !== false} />
    </>
  )
}

const NoResults = ({
  query,
  onClearSearch,
}: {
  query: string
  onClearSearch: () => void
}) => {
  return (
    <div
      className="text-center py-16 bg-surface rounded-lg border border-border"
      data-testid="search-no-results"
    >
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <MagnifyingGlass className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        No products found
      </h3>
      <p className="text-text-secondary mb-6">
        {query
          ? `No results for "${query}". Try a different search term or remove a filter.`
          : "No products match these filters."}
      </p>
      {query && (
        <button
          type="button"
          onClick={onClearSearch}
          className="px-5 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Clear Search
        </button>
      )}
    </div>
  )
}

export default ProductSearchResults
