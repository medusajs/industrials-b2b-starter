import { useAuth } from "@/lib/hooks/use-auth"
import { getPriceSortValues, getProductSortOptions } from "@/lib/search-sort"
import { PRODUCT_INDEX_NAME } from "@/lib/search-client"
import { useEffect, useMemo } from "react"
import { useSortBy } from "react-instantsearch"

type SortSelectProps = {
  className?: string
  currencyCode?: string | null
}

export const SortSelect = ({
  className = "",
  currencyCode,
}: SortSelectProps) => {
  const { isAuthenticated, isLoading } = useAuth()

  const priceSortValues = useMemo(
    () => getPriceSortValues(currencyCode),
    [currencyCode]
  )

  const items = useMemo(() => {
    const options = getProductSortOptions(currencyCode)

    return isAuthenticated
      ? options
      : options.filter((option) => !priceSortValues.includes(option.value))
  }, [isAuthenticated, currencyCode, priceSortValues])

  const { currentRefinement, options, refine } = useSortBy({ items })

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return
    }

    if (priceSortValues.includes(currentRefinement)) {
      refine(PRODUCT_INDEX_NAME)
    }
  }, [isAuthenticated, isLoading, currentRefinement, refine, priceSortValues])

  return (
    <select
      value={currentRefinement}
      onChange={(event) => refine(event.target.value)}
      aria-label="Sort results"
      className={
        className ||
        "px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
      }
      data-testid="sort-select"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          Sort: {option.label}
        </option>
      ))}
    </select>
  )
}

export default SortSelect
