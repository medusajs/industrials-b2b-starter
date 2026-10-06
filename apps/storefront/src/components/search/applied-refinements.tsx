import { XMark } from "@medusajs/icons"
import { useClearRefinements, useCurrentRefinements } from "react-instantsearch"

const ATTRIBUTE_LABELS: Record<string, string> = {
  category: "Category",
  labels: "Label",
  option_values: "Option",
}

/** The price facets carry a currency suffix, e.g. `min_price_usd`. */
const attributeLabel = (attribute: string) => {
  if (attribute.startsWith("min_price_") || attribute.startsWith("max_price_")) {
    return "Price"
  }

  if (attribute.startsWith("on_sale_")) {
    return "On sale"
  }

  return ATTRIBUTE_LABELS[attribute] ?? attribute
}

const chipLabel = (
  attribute: string,
  refinement: { label: string; operator?: string; type: string }
) => {
  if (refinement.type === "numeric") {
    const operator = refinement.operator === ">=" ? "from" : "up to"
    return `${attributeLabel(attribute)} ${operator} ${refinement.label}`
  }

  if (attribute === "option_values") {
    const separator = refinement.label.indexOf(":")
    return separator > 0
      ? `${refinement.label.slice(0, separator)}: ${refinement.label.slice(separator + 1)}`
      : refinement.label
  }

  if (attribute.startsWith("on_sale_")) {
    return "On sale"
  }

  return `${attributeLabel(attribute)}: ${refinement.label}`
}

export const AppliedRefinements = () => {
  const { items } = useCurrentRefinements()
  const { canRefine: canClear, refine: clearAll } = useClearRefinements()

  if (!items.length) {
    return null
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="applied-refinements"
    >
      {items.map((item) =>
        item.refinements.map((refinement) => (
          <button
            key={`${item.attribute}-${refinement.label}-${refinement.value}`}
            type="button"
            onClick={() => item.refine(refinement)}
            className="inline-flex items-center gap-x-1 px-2.5 py-1 bg-accent-light text-text-primary text-xs font-medium rounded-full hover:bg-accent hover:text-white transition-colors cursor-pointer"
            data-testid="applied-refinement"
          >
            {chipLabel(item.attribute, refinement)}
            <XMark className="w-3 h-3" />
          </button>
        ))
      )}
      {canClear && (
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-medium text-text-secondary hover:text-accent underline cursor-pointer"
          data-testid="clear-refinements"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

export default AppliedRefinements
