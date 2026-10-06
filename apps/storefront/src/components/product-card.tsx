import { Link, useNavigate } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@/lib/utils/price"
import { useCreateQuoteFromCart } from "@/lib/hooks/use-quotes"
import { useAddToCart, useCart } from "@/lib/hooks/use-cart"
import { useAuth } from "@/lib/hooks/use-auth"
import { toast } from "sonner"
import { useState } from "react"
import { QuoteModal } from "@/components/quote-modal"
import { getStoredCart } from "@/lib/utils/cart"
import { DocumentText } from "@medusajs/icons"

interface ProductCardProps {
  product: HttpTypes.StoreProduct
  regionId: string
  countryCode: string
}

export function ProductCard({ product, regionId, countryCode }: ProductCardProps) {
  const { cheapestPrice } = getProductPrice({ product })
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const addToCartMutation = useAddToCart()
  const createQuoteFromCartMutation = useCreateQuoteFromCart()
  const { data: cart } = useCart()
  const [isQuoting, setIsQuoting] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  
  const variants = product.variants ?? []
  const isDefault = variants.length === 1 && product.options?.some((o) => o.title === "Default option")
  const variantCount = isDefault ? 0 : variants.length
  const sku = variants[0]?.sku || "N/A"
  const additionalSkus = variantCount > 1 ? variantCount - 1 : 0
  const category = product.categories?.[0]?.name || product.collection?.title || "Equipment"

  const primaryImage = product.thumbnail || product.images?.[0]?.url
  const secondImage = product.images && product.images.length > 1 ? product.images[1]?.url : null

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast.error("Please log in to request a quote")
      navigate({ to: "/$countryCode/account/login" as string, params: { countryCode } })
      return
    }
    const variant = product.variants?.[0]
    if (!variant?.id) {
      toast.error("Product not available for quote")
      return
    }
    setIsQuoting(true)
    addToCartMutation.mutate(
      {
        variant_id: variant.id,
        quantity: 1,
        country_code: countryCode,
        product,
        variant,
      },
      {
        onSuccess: () => {
          setIsQuoting(false)
          setShowQuoteModal(true)
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to add to cart")
          setIsQuoting(false)
        },
      }
    )
  }

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col">
      {/* Image */}
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
        <Link 
          to="/$countryCode/products/$handle"
          params={{ countryCode, handle: product.handle || "" }}
          className="block w-full h-full"
        >
          {primaryImage ? (
            <>
              <img
                src={primaryImage}
                alt={product.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${secondImage ? "group-hover:opacity-0" : "group-hover:scale-105 transition-transform"}`}
              />
              {secondImage && (
                <img
                  src={secondImage}
                  alt={`${product.title} - alternate view`}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-text-muted">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
        </Link>
        {/* Category Badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-800/90 text-white text-xs font-medium rounded pointer-events-none">
          {category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <Link 
          to="/$countryCode/products/$handle"
          params={{ countryCode, handle: product.handle || "" }}
          className="block"
        >
          <h3 className="text-sm font-semibold text-text-primary mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-accent transition-colors">
            {product.title}
          </h3>
        </Link>
        
        {/* SKU */}
        <p className="text-xs text-text-muted mb-3 font-mono">
          {sku}
          {additionalSkus > 0 && (
            <span className="ml-1">+ {additionalSkus} more</span>
          )}
        </p>

        {/* Price + Quote button */}
        <div className="mt-auto flex items-center justify-between">
          {cheapestPrice ? (
            <p className="text-base font-bold text-text-primary">
              {cheapestPrice.calculated_price}
            </p>
          ) : (
            <p className="text-sm text-text-secondary">Contact for price</p>
          )}
          <button
            onClick={handleQuoteClick}
            disabled={isQuoting || addToCartMutation.isPending}
            className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-accent-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Request Quote"
          >
            {isQuoting ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <DocumentText className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        onContinueShopping={() => {
          setShowQuoteModal(false)
          toast.success("Item added to cart for quote")
        }}
        onRequestQuote={() => {
          const cartId = getStoredCart()
          if (!cartId) {
            toast.error("No cart found")
            setShowQuoteModal(false)
            return
          }
          createQuoteFromCartMutation.mutate(
            { cart_id: cartId },
            {
              onSuccess: () => {
                setShowQuoteModal(false)
                toast.success("Quote request submitted!")
                navigate({ to: "/$countryCode/quotes", params: { countryCode } })
              },
              onError: (error: Error) => {
                toast.error(error.message || "Failed to create quote")
              },
            }
          )
        }}
        isSubmitting={createQuoteFromCartMutation.isPending}
        productTitle={product.title}
      />
    </div>
  )
}

export default ProductCard
