interface PriceProps {
  price?: number | null
  amount?: number
  currencyCode: string
  className?: string
  textSize?: "small" | "medium" | "large"
  textWeight?: "normal" | "plus"
  type?: "default" | "discount"
  originalPrice?: {
    price: number
    percentage: number | string
  }
}

export function Price({
  price,
  amount,
  currencyCode,
  className = "",
  textSize = "medium",
  textWeight = "normal",
  type = "default",
  originalPrice,
}: PriceProps) {
  const value = price ?? amount ?? 0

  // Guard against missing currency code
  if (!currencyCode) {
    return <span className={className}>--</span>
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(value)

  const sizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-2xl",
  }

  const weightClasses = {
    normal: "font-normal",
    plus: "font-semibold",
  }

  const displayValue = type === "discount" && value > 0 ? `-${formatted}` : formatted

  return (
    <span className={`${sizeClasses[textSize]} ${weightClasses[textWeight]} text-zinc-900 ${className}`}>
      {originalPrice && (
        <span className="text-zinc-500 line-through mr-2">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyCode,
          }).format(originalPrice.price)}
        </span>
      )}
      {displayValue}
    </span>
  )
}

export default Price
