import type { StoreProduct, StoreProductOption } from "@medusajs/types"

interface ProductOptionSelectProps {
  option: StoreProductOption
  current: string | undefined
  updateOption: (optionId: string, value: string) => void
  disabled: boolean
  product: StoreProduct
}

export function ProductOptionSelect({
  option,
  current,
  updateOption,
  disabled,
}: ProductOptionSelectProps) {
  const values = option.values ?? []

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900">
        {option.title}
      </label>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const isSelected = current === value.value
          return (
            <button
              key={value.id}
              onClick={() => updateOption(option.id, value.value)}
              disabled={disabled}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                ${isSelected 
                  ? "border-gray-900 bg-gray-900 text-white" 
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {value.value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ProductOptionSelect
