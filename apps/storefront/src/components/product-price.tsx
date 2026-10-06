import { Loading } from "@/components/ui/loading"
import { getProductPrice, formatPrice } from "@/lib/utils/price"
import { HttpTypes } from "@medusajs/types"
import { LockClosedSolid } from "@medusajs/icons"

export function LockedPrice({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      <div className="flex items-center gap-2 text-text-muted">
        <LockClosedSolid className="w-5 h-5" />
        <span className="text-lg font-medium">Price available after sign in</span>
      </div>
      <a 
        href="/us/account"
        className="text-sm text-accent hover:text-accent-hover underline"
      >
        Sign in to view pricing
      </a>
    </div>
  )
}

export interface ProductPriceProps {
  textSize?: "small" | "medium" | "large"
  textWeight?: "normal" | "medium" | "semibold" | "bold"
}

export default function ProductPrice({
  product,
  variant,
  className,
  priceProps,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  className?: string
  priceProps?: Partial<ProductPriceProps>
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variant_id: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  // If no price available (user not authenticated or no price set), show locked price
  if (!selectedPrice || isNaN(selectedPrice.calculated_price_number)) {
    return <LockedPrice className={className} />
  }

  const textSizeClasses = {
    small: "text-sm",
    medium: "text-lg",
    large: "text-2xl",
  }

  const textWeightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  }

  const sizeClass = textSizeClasses[priceProps?.textSize || "large"]
  const weightClass = textWeightClasses[priceProps?.textWeight || "semibold"]

  return (
    <div className={`flex flex-col ${className || ""}`}>
      {!variant && (
        <span className="text-sm text-text-muted">Starting at</span>
      )}
      <span className={`${sizeClass} ${weightClass} text-text-primary`}>
        {selectedPrice.calculated_price}
      </span>
      {selectedPrice.price_type === "sale" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted line-through">
            {selectedPrice.original_price}
          </span>
          <span className="text-sm text-red-600 font-medium">
            -{selectedPrice.percentage_diff}%
          </span>
        </div>
      )}
    </div>
  )
}