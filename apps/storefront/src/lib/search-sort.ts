import { PRODUCT_INDEX_NAME, priceAttribute } from "@/lib/search-client"

const sortValue = (field: string, direction: "asc" | "desc") =>
  `${PRODUCT_INDEX_NAME}/sort/${field}:${direction}`

/**
 * The price fields are per currency, so the region's currency picks which set
 * is sorted on.
 */
export const getPriceSortValues = (currencyCode?: string | null) => {
  const minPrice = priceAttribute("min_price", currencyCode)

  return [sortValue(minPrice, "asc"), sortValue(minPrice, "desc")]
}

export const getProductSortOptions = (currencyCode?: string | null) => {
  const [priceAsc, priceDesc] = getPriceSortValues(currencyCode)

  return [
    { label: "Relevance", value: PRODUCT_INDEX_NAME },
    { label: "Newest", value: sortValue("created_at", "desc") },
    { label: "Name: A-Z", value: sortValue("title", "asc") },
    { label: "Name: Z-A", value: sortValue("title", "desc") },
    { label: "Price: Low to High", value: priceAsc },
    { label: "Price: High to Low", value: priceDesc },
  ]
}

export const PRODUCT_HITS_PER_PAGE = 24
