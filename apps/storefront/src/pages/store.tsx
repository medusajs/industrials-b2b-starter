import { Link, useLoaderData } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { ChevronRight, MagnifyingGlass } from "@medusajs/icons"
import type { SearchClient } from "instantsearch.js"
import { useEffect, useState } from "react"
import { Configure, InstantSearch } from "react-instantsearch"

import { AppliedRefinements } from "@/components/search/applied-refinements"
import { ProductFacets } from "@/components/search/product-facets"
import {
  ProductSearchResults,
  SearchResultsCount,
} from "@/components/search/product-search-results"
import { SortSelect } from "@/components/search/sort-select"
import { useAuth } from "@/lib/hooks/use-auth"
import { useDebouncedSearchBox } from "@/lib/hooks/use-debounced-search-box"
import { PRODUCT_INDEX_NAME, searchClient } from "@/lib/search-client"
import { PRODUCT_HITS_PER_PAGE } from "@/lib/search-sort"

interface StorePageData {
  region: HttpTypes.StoreRegion
  countryCode: string
}

type StoreExperienceProps = {
  variant: "public" | "authenticated"
  countryCode: string
  region?: HttpTypes.StoreRegion
}

const StoreSearchExperience = ({
  variant,
  countryCode,
  region,
}: StoreExperienceProps) => {
  const { inputValue, setValue, reset, query, hasInput, isPending } =
    useDebouncedSearchBox()

  const isPublic = variant === "public"

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full lg:w-64 lg:shrink-0">
        <div className="bg-surface border border-border rounded-lg p-4 lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            Filters
          </h2>
          <ProductFacets currencyCode={region?.currency_code} />
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div
          className={
            isPublic
              ? "bg-surface rounded-lg border border-border p-3 mb-4"
              : "mb-4"
          }
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="search"
                placeholder="Search equipment..."
                aria-label="Search equipment"
                value={inputValue}
                onChange={(event) => setValue(event.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                data-testid="store-search-input"
              />
            </div>
            <SortSelect currencyCode={region?.currency_code} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <SearchResultsCount />
          {isPublic && (
            <Link
              to={"/$countryCode/account/login" as string}
              params={{ countryCode }}
              className="text-xs font-medium text-accent hover:text-accent-hover"
            >
              Sign in for pricing
            </Link>
          )}
        </div>

        <div className="mb-4">
          <AppliedRefinements />
        </div>

        <ProductSearchResults
          variant={variant}
          countryCode={countryCode}
          region={region}
          hasInput={hasInput}
          isPending={isPending}
          query={query}
          onClearSearch={reset}
        />
      </div>
    </div>
  )
}

const StoreSkeleton = () => (
  <div className="flex gap-6">
    <div className="hidden lg:block w-64 shrink-0">
      <div className="h-72 bg-surface border border-border rounded-lg animate-pulse" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="h-10 bg-surface border border-border rounded-lg animate-pulse mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="bg-surface rounded-lg border border-border overflow-hidden animate-pulse"
          >
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const StoreSearch = (props: StoreExperienceProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const { isLoading: isAuthLoading } = useAuth()

  useEffect(() => setIsMounted(true), [])

  if (!isMounted || isAuthLoading) {
    return <StoreSkeleton />
  }

  return (
    <InstantSearch
      indexName={PRODUCT_INDEX_NAME}
      searchClient={searchClient as unknown as SearchClient}
      routing
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={PRODUCT_HITS_PER_PAGE} />
      <StoreSearchExperience {...props} />
    </InstantSearch>
  )
}

export function StorePage() {
  const loaderData = useLoaderData({ strict: false }) as
    | StorePageData
    | undefined
  const { region, countryCode = "us" } = loaderData || {}
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-slate-900 text-white py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
              <Link
                to={"/$countryCode" as string}
                params={{ countryCode }}
                className="hover:text-white transition-colors"
              >
                Home
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Equipment Catalog</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Equipment Catalog
            </h1>
            <p className="text-slate-300 max-w-2xl">
              Browse our selection of industrial equipment. Sign in to view
              pricing.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <StoreSearch
            variant="public"
            countryCode={countryCode}
            region={region}
          />
        </div>

        {/* CTA Section */}
        <section className="bg-slate-900 py-10 mt-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl font-bold text-white mb-3">
              Ready to Get Started?
            </h2>
            <p className="text-sm text-slate-400 mb-5">
              Create a business account to access fleet pricing and request
              quotes.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to={"/$countryCode/account/register" as string}
                params={{ countryCode }}
                className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                Create Account
              </Link>
              <Link
                to={"/$countryCode/account/login" as string}
                params={{ countryCode }}
                className="px-5 py-2.5 border-2 border-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8">
        <StoreSearch
          variant="authenticated"
          countryCode={countryCode}
          region={region}
        />
      </div>
    </div>
  )
}

export default StorePage
