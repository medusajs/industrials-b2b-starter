import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"
import { useCartDrawer } from "@/lib/context/cart"
import { useAddToCart } from "@/lib/hooks/use-cart"
import { isVariantInStock } from "@/lib/utils/product"
import { getPricesForVariant } from "@/lib/utils/price"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { HttpTypes } from "@medusajs/types"
import { useLocation } from "@tanstack/react-router"
import { useState, useMemo, useCallback } from "react"
import { Minus, Plus, ShoppingCart, Spinner } from "@medusajs/icons"

type BulkVariantTableProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}

export function BulkVariantTable({ product, region }: BulkVariantTableProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [isAdding, setIsAdding] = useState(false)
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "us"

  const addToCartMutation = useAddToCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const { openCart } = useCartDrawer()

  const variants = product.variants || []
  const options = product.options || []

  const hasRealOptions = useMemo(
    () =>
      options.length > 0 &&
      !options.every(
        (o) =>
          o.title?.toLowerCase() === "default option" ||
          o.title?.toLowerCase() === "default"
      ),
    [options]
  )

  const optionTitles = useMemo(
    () => (hasRealOptions ? options.map((o) => o.title ?? "Option") : []),
    [options, hasRealOptions]
  )

  const getVariantOptionValues = useCallback(
    (variant: HttpTypes.StoreProductVariant) => {
      return options.map((option) => {
        const variantOption = variant.options?.find(
          (vo) => vo.option_id === option.id
        )
        return variantOption?.value ?? "-"
      })
    },
    [options]
  )

  const setQuantity = (variantId: string, qty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [variantId]: Math.max(0, qty),
    }))
  }

  const totalItems = useMemo(
    () => Object.values(quantities).reduce((sum, q) => sum + q, 0),
    [quantities]
  )

  const handleAddToCart = async () => {
    const itemsToAdd = variants.filter(
      (v) => (quantities[v.id] || 0) > 0 && isVariantInStock(v)
    )
    if (itemsToAdd.length === 0) return

    setIsAdding(true)
    try {
      for (const variant of itemsToAdd) {
        await addToCartMutation.mutateAsync({
          variant_id: variant.id,
          quantity: quantities[variant.id],
          country_code: countryCode,
          product,
          variant,
          region,
        })
      }
      setQuantities({})
      openCart()
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                SKU
              </th>
              {optionTitles.map((title, i) => (
                <th
                  key={i}
                  className="text-left py-3 px-4 font-semibold text-text-secondary text-xs uppercase tracking-wider"
                >
                  {title}
                </th>
              ))}
              <th className="text-right py-3 px-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                Unit Price
              </th>
              <th className="text-center py-3 px-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                Quantity
              </th>

            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => {
              const inStock = isVariantInStock(variant)
              const price = getPricesForVariant(variant)
              const optionValues = getVariantOptionValues(variant)
              const qty = quantities[variant.id] || 0

              return (
                <tr
                  key={variant.id}
                  title={!inStock ? "This variant is currently out of stock" : undefined}
                  className={`border-b border-border last:border-b-0 transition-colors ${
                    !inStock ? "opacity-40 bg-slate-50/50 cursor-not-allowed" : "hover:bg-slate-50/50"
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-text-muted">
                      {variant.sku || "-"}
                    </span>
                  </td>
                  {hasRealOptions &&
                    optionValues.map((val, i) => (
                      <td key={i} className="py-3 px-4">
                        <span className="font-medium text-text-primary">{val}</span>
                      </td>
                    ))}
                  <td className="py-3 px-4 text-right">
                    {price ? (
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-text-primary">
                          {price.calculated_price}
                        </span>
                        {price.price_type === "sale" && (
                          <span className="text-xs text-text-muted line-through">
                            {price.original_price}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setQuantity(variant.id, qty - 1)}
                        disabled={!inStock || qty <= 0}
                        className="w-7 h-7 flex items-center justify-center rounded border border-border text-text-muted hover:bg-slate-100 hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) =>
                          setQuantity(variant.id, parseInt(e.target.value) || 0)
                        }
                        disabled={!inStock}
                        className="w-12 h-7 text-center text-sm font-medium border border-border rounded bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setQuantity(variant.id, qty + 1)}
                        disabled={!inStock}
                        className="w-7 h-7 flex items-center justify-center rounded border border-border text-text-muted hover:bg-slate-100 hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={handleAddToCart}
          disabled={isAdding || totalItems === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isAdding ? (
            <Spinner className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          Add to Cart
        </button>
      </div>
    </div>
  )
}
