import { Button } from "@/components/ui/button"
import { indexedCurrency, priceAttribute } from "@/lib/search-client"
import { formatPrice } from "@/lib/utils/price"
import { useEffect, useState } from "react"
import { useRange } from "react-instantsearch"

/** Only used to key the widget's test ids — the facet itself is per currency. */
const ATTRIBUTE = "min_price"

type PriceRangeRefinementProps = {
  currencyCode?: string | null
}

const toInputValue = (bound: number | undefined) =>
  typeof bound === "number" && Number.isFinite(bound) ? String(bound) : ""

const toBound = (value: string) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const PriceRangeRefinement = ({
  currencyCode,
}: PriceRangeRefinementProps = {}) => {
  const { range, start, refine, canRefine } = useRange({
    attribute: priceAttribute("min_price", currencyCode),
  })

  const currency = indexedCurrency(currencyCode)

  const [minInput, setMinInput] = useState("")
  const [maxInput, setMaxInput] = useState("")

  const [startMin, startMax] = start

  useEffect(() => {
    setMinInput(toInputValue(startMin))
  }, [startMin])

  useEffect(() => {
    setMaxInput(toInputValue(startMax))
  }, [startMax])

  if (!canRefine) {
    return null
  }

  const bounds = [range.min, range.max]
    .map((bound) =>
      typeof bound === "number" && Number.isFinite(bound)
        ? formatPrice({
            amount: bound,
            currency_code: currency,
            maximumFractionDigits: 0,
          })
        : null
    )
    .filter(Boolean)

  return (
    <form
      data-testid={`refinement-${ATTRIBUTE}`}
      onSubmit={(event) => {
        event.preventDefault()
        refine([toBound(minInput), toBound(maxInput)])
      }}
    >
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
          Price ({currency.toUpperCase()})
        </legend>
        <div className="flex items-center gap-x-2">
          <input
            type="number"
            inputMode="decimal"
            min={range.min}
            max={range.max}
            value={minInput}
            onChange={(event) => setMinInput(event.target.value)}
            placeholder={toInputValue(range.min) || "Min"}
            aria-label="Minimum price"
            className="w-full min-w-0 px-2 py-1.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            data-testid={`refinement-${ATTRIBUTE}-min`}
          />
          <span className="text-text-muted text-sm">–</span>
          <input
            type="number"
            inputMode="decimal"
            min={range.min}
            max={range.max}
            value={maxInput}
            onChange={(event) => setMaxInput(event.target.value)}
            placeholder={toInputValue(range.max) || "Max"}
            aria-label="Maximum price"
            className="w-full min-w-0 px-2 py-1.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            data-testid={`refinement-${ATTRIBUTE}-max`}
          />
        </div>
        {bounds.length === 2 && (
          <p className="mt-1.5 text-xs text-text-muted">
            {bounds[0]} – {bounds[1]} across these results
          </p>
        )}
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          data-testid={`refinement-${ATTRIBUTE}-apply`}
        >
          Apply price
        </Button>
      </fieldset>
    </form>
  )
}

export default PriceRangeRefinement
