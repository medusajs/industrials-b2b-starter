import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { clsx } from "clsx"
import { ChevronRight } from "@medusajs/icons"
import { sdk } from "@/lib/utils/sdk"
import { OPTION_VALUE_QUERY_KEY } from "@/lib/utils/option-value-params"

type ProductOptionValue = {
  id: string
  value: string
}

type ProductOption = {
  id: string
  title: string
  values?: ProductOptionValue[]
  is_exclusive?: boolean
}

type OptionsPickerProps = {
  selectedValueIds: string[]
  onChange: (next: string[]) => void
  className?: string
}

const fetchGlobalOptions = async (): Promise<ProductOption[]> => {
  const response = await sdk.client.fetch<{ product_options: ProductOption[] }>(
    "/store/product-options",
    {
      method: "GET",
      query: {
        is_exclusive: false,
        fields: "*values",
      },
    }
  )
  return response.product_options ?? []
}

export function OptionsPicker({
  selectedValueIds,
  onChange,
  className,
}: OptionsPickerProps) {
  const { data: options = [], isLoading } = useQuery({
    queryKey: ["global-product-options"],
    queryFn: fetchGlobalOptions,
  })

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Expand all groups by default once data loads.
  useEffect(() => {
    if (options.length > 0) {
      setExpanded((prev) => {
        const next = { ...prev }
        for (const opt of options) {
          if (next[opt.id] === undefined) next[opt.id] = true
        }
        return next
      })
    }
  }, [options])

  const selectedSet = useMemo(
    () => new Set(selectedValueIds),
    [selectedValueIds]
  )

  if (isLoading) {
    return (
      <div className={clsx("space-y-3", className)}>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!options.length) {
    return null
  }

  const toggleValue = (valueId: string) => {
    const next = new Set(selectedSet)
    if (next.has(valueId)) {
      next.delete(valueId)
    } else {
      next.add(valueId)
    }
    onChange(Array.from(next))
  }

  const toggleGroup = (optionId: string) => {
    setExpanded((prev) => ({ ...prev, [optionId]: !prev[optionId] }))
  }

  return (
    <div className={clsx("space-y-4", className)} data-key={OPTION_VALUE_QUERY_KEY}>
      {options.map((option) => {
        const isOpen = expanded[option.id] ?? true
        const values = option.values ?? []
        if (!values.length) return null

        return (
          <div key={option.id} className="border-b border-border pb-3">
            <button
              type="button"
              onClick={() => toggleGroup(option.id)}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-text-primary mb-2 cursor-pointer"
            >
              <span>{option.title}</span>
              <ChevronRight
                className={clsx(
                  "w-4 h-4 text-text-muted transition-transform",
                  isOpen && "rotate-90"
                )}
              />
            </button>
            {isOpen && (
              <div className="flex flex-wrap gap-2">
                {values.map((v) => {
                  const isSelected = selectedSet.has(v.id)
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleValue(v.id)}
                      className={clsx(
                        "px-3 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer",
                        isSelected
                          ? "bg-accent text-white border-accent"
                          : "bg-surface border-border text-text-secondary hover:border-accent hover:text-accent"
                      )}
                    >
                      {v.value}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default OptionsPicker
