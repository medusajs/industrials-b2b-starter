import { Checkbox } from "@/components/ui/checkbox"
import { priceAttribute } from "@/lib/search-client"
import { useToggleRefinement } from "react-instantsearch"

type OnSaleToggleProps = {
  currencyCode?: string | null
}

export const OnSaleToggle = ({ currencyCode }: OnSaleToggleProps = {}) => {
  const { value, refine } = useToggleRefinement({
    attribute: priceAttribute("on_sale", currencyCode),
    on: true,
  })

  if (!value.isRefined && !value.count) {
    return null
  }

  return (
    <label
      className="flex items-center gap-x-2 cursor-pointer group"
      data-testid="refinement-on_sale"
    >
      <Checkbox
        checked={value.isRefined}
        onChange={() => refine(value)}
        data-testid="refinement-on_sale-checkbox"
      />
      <span className="text-sm text-text-primary group-hover:text-accent transition-colors">
        On sale only
      </span>
      {typeof value.count === "number" && (
        <span className="ml-auto text-xs text-text-muted tabular-nums">
          {value.count}
        </span>
      )}
    </label>
  )
}

export default OnSaleToggle
