import { Checkbox } from "@/components/ui/checkbox"
import { useMemo } from "react"
import { useRefinementList } from "react-instantsearch"

const ATTRIBUTE = "option_values"

const PLACEHOLDER_OPTION_TITLE = "Default option"

const dropPlaceholderOption = <T extends { label: string }>(items: T[]) =>
  items.filter(
    (item) => !item.label.startsWith(`${PLACEHOLDER_OPTION_TITLE}:`)
  )

type Group = {
  title: string
  values: { value: string; label: string; count: number; isRefined: boolean }[]
}

const groupItems = (
  items: { value: string; label: string; count: number; isRefined: boolean }[]
): Group[] => {
  const groups = new Map<string, Group>()

  for (const item of items) {
    const separator = item.label.indexOf(":")

    const title =
      separator > 0 ? item.label.slice(0, separator) : "Other options"
    const label = separator > 0 ? item.label.slice(separator + 1) : item.label

    const group = groups.get(title) ?? { title, values: [] }
    group.values.push({ ...item, label })
    groups.set(title, group)
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  )
}

export const OptionValuesRefinement = () => {
  const { items, refine } = useRefinementList({
    attribute: ATTRIBUTE,
    limit: 100,
    sortBy: ["name:asc"],
    transformItems: dropPlaceholderOption,
  })

  const groups = useMemo(() => groupItems(items), [items])

  if (!groups.length) {
    return null
  }

  return (
    <div className="space-y-4" data-testid={`refinement-${ATTRIBUTE}`}>
      {groups.map((group) => (
        <fieldset key={group.title}>
          <legend className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
            {group.title}
          </legend>
          <ul className="space-y-1.5">
            {group.values.map((item) => (
              <li key={item.value}>
                <label className="flex items-center gap-x-2 cursor-pointer group">
                  <Checkbox
                    checked={item.isRefined}
                    onChange={() => refine(item.value)}
                    data-testid={`refinement-${ATTRIBUTE}-${item.value}`}
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
        </fieldset>
      ))}
    </div>
  )
}

export default OptionValuesRefinement
