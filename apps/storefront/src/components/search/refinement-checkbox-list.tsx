import { Checkbox } from "@/components/ui/checkbox"
import { useRefinementList } from "react-instantsearch"

type RefinementCheckboxListProps = {
  attribute: string
  title: string
  limit?: number
  showMoreLimit?: number
}

export const RefinementCheckboxList = ({
  attribute,
  title,
  limit = 8,
  showMoreLimit = 30,
}: RefinementCheckboxListProps) => {
  const { items, refine, canToggleShowMore, isShowingMore, toggleShowMore } =
    useRefinementList({
      attribute,
      limit,
      showMore: true,
      showMoreLimit,
    })

  if (!items.length) {
    return null
  }

  return (
    <fieldset data-testid={`refinement-${attribute}`}>
      <legend className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
        {title}
      </legend>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.value}>
            <label className="flex items-center gap-x-2 cursor-pointer group">
              <Checkbox
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                data-testid={`refinement-${attribute}-${item.value}`}
              />
              <span className="text-sm text-text-primary group-hover:text-accent transition-colors truncate">
                {item.label}
              </span>
              <span className="ml-auto text-xs text-text-muted tabular-nums">
                {item.count}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {canToggleShowMore && (
        <button
          type="button"
          onClick={toggleShowMore}
          className="mt-2 text-xs font-medium text-accent hover:text-accent-hover cursor-pointer"
        >
          {isShowingMore ? "Show less" : "Show more"}
        </button>
      )}
    </fieldset>
  )
}

export default RefinementCheckboxList
