import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Loading } from "@/components/ui/loading"
import { SearchHit, type ProductHit } from "@/components/search/search-hit"
import { useDebouncedSearchBox } from "@/lib/hooks/use-debounced-search-box"
import { useSearchSettled } from "@/lib/hooks/use-search-settled"
import { PRODUCT_INDEX_NAME, searchClient } from "@/lib/search-client"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { MagnifyingGlass } from "@medusajs/icons"
import { useLocation } from "@tanstack/react-router"
import type { SearchClient } from "instantsearch.js"
import { useState } from "react"
import {
  Configure,
  InstantSearch,
  useHits,
  useInstantSearch,
} from "react-instantsearch"

const HITS_PER_PAGE = 12

type SearchPanelProps = {
  countryCode: string
  onNavigate: () => void
}

const SearchPanel = ({ countryCode, onNavigate }: SearchPanelProps) => {
  const {
    inputValue,
    setValue,
    query: trimmedQuery,
    hasInput,
    isPending,
  } = useDebouncedSearchBox()

  const { items } = useHits<ProductHit>()
  const { status, error } = useInstantSearch()
  const { isSettled, hasNoResultsYet, resultsQuery } = useSearchSettled()

  const isEmptyQueryLeftover = hasInput && !resultsQuery
  const hasResults = hasInput && !isEmptyQueryLeftover && items.length > 0

  const showLoading =
    hasInput && !hasResults && (hasNoResultsYet || isEmptyQueryLeftover)

  return (
    <>
      <div className="flex items-center gap-x-3 border-b border-zinc-200 px-6">
        <MagnifyingGlass className="flex-shrink-0 text-zinc-400" />
        <input
          type="search"
          value={inputValue}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search equipment..."
          aria-label="Search equipment"
          autoFocus
          className="w-full bg-transparent py-4 text-base text-zinc-900 outline-none focus-visible:outline-none! placeholder:text-zinc-400"
          data-testid="search-input"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {!hasInput ? (
          <p
            className="px-6 py-6 text-center text-sm text-zinc-500"
            data-testid="search-prompt"
          >
            Start typing to search for equipment.
          </p>
        ) : status === "error" ? (
          <div
            className="px-6 py-6 text-center text-sm text-red-600"
            data-testid="search-error"
          >
            <p className="font-medium">Couldn&apos;t search equipment.</p>
            {error?.message && (
              <p className="mt-1 text-xs text-red-500 break-words">
                {error.message}
              </p>
            )}
          </div>
        ) : hasResults ? (
          <ul className="py-2" data-testid="search-results">
            {items.map((hit) => (
              <SearchHit
                key={hit.objectID}
                hit={hit}
                countryCode={countryCode}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        ) : showLoading ? (
          <div className="px-4 py-4" data-testid="search-loading">
            <Loading rows={4} height="h-16" />
          </div>
        ) : 
        !isSettled || isPending || !trimmedQuery ? null : (
          <p
            className="px-6 py-6 text-center text-sm text-zinc-600"
            data-testid="search-no-results"
          >
            No equipment found for &quot;{trimmedQuery}&quot;
          </p>
        )}
      </div>
    </>
  )
}

type SearchDrawerProps = {
  triggerClassName?: string
  triggerLabel?: string
}

export const SearchDrawer = ({
  triggerClassName = "p-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer",
  triggerLabel,
}: SearchDrawerProps = {}) => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "us"

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger
        aria-label="Search"
        className={triggerClassName}
        data-testid="nav-search-button"
      >
        <MagnifyingGlass className="w-5 h-5 flex-shrink-0" />
        {triggerLabel}
      </DrawerTrigger>
      <DrawerContent side="right" className="flex flex-col">
        <DrawerHeader>
          <DrawerTitle className="text-lg font-semibold tracking-tight">
            Search
          </DrawerTitle>
        </DrawerHeader>
        {/* The one provider for this search: the field, the hits and every
            other widget below it read from here. */}
        <InstantSearch
          indexName={PRODUCT_INDEX_NAME}
          searchClient={searchClient as unknown as SearchClient}
          future={{ preserveSharedStateOnUnmount: true }}
        >
          <Configure hitsPerPage={HITS_PER_PAGE} />
          <SearchPanel
            countryCode={countryCode}
            onNavigate={() => setIsOpen(false)}
          />
        </InstantSearch>
      </DrawerContent>
    </Drawer>
  )
}

export default SearchDrawer
