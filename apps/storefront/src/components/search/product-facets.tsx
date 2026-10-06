import { OnSaleToggle } from "@/components/search/on-sale-toggle"
import { OptionValuesRefinement } from "@/components/search/option-values-refinement"
import { PriceRangeRefinement } from "@/components/search/price-range-refinement"
import { RefinementCheckboxList } from "@/components/search/refinement-checkbox-list"
import { useAuth } from "@/lib/hooks/use-auth"

type ProductFacetsProps = {
  currencyCode?: string | null
}

export const ProductFacets = ({ currencyCode }: ProductFacetsProps = {}) => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-5" data-testid="product-facets">
      <RefinementCheckboxList attribute="category" title="Category" />
      {isAuthenticated && <PriceRangeRefinement currencyCode={currencyCode} />}
      <OnSaleToggle currencyCode={currencyCode} />
      <RefinementCheckboxList attribute="labels" title="Labels" />
      <OptionValuesRefinement />
    </div>
  )
}

export default ProductFacets
