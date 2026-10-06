import { Link, useLoaderData } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import ProductPrice, { LockedPrice } from "@/components/product-price"
import { BulkVariantTable } from "@/components/bulk-variant-table"
import { ImageGallery } from "@/components/ui/image-gallery"
import { ChevronRight, Check } from "@medusajs/icons"
import { useAuth } from "@/lib/hooks/use-auth"

interface ProductPageData {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

export function ProductPage() {
  const loaderData = useLoaderData({ strict: false }) as ProductPageData | undefined
  const { product, region, countryCode = "us" } = loaderData || {}
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Product not found</h1>
          <p className="text-text-secondary mb-6">The product you're looking for doesn't exist.</p>
          <Link 
            to={"/$countryCode/store" as string} params={{ countryCode }}
            className="px-5 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors"
          >
            Back to Catalog
          </Link>
        </div>
      </div>
    )
  }

  // Build images array preserving proper structure for ImageGallery
  const productImages = product.images || []
  const images = productImages.length > 0 
    ? productImages 
    : product.thumbnail 
      ? [{ id: 'thumbnail', url: product.thumbnail, rank: 0 } as HttpTypes.StoreProductImage] 
      : []

  // Extract metadata
  const brand = (product.metadata?.brand as string) || "ProLift"
  const sku = product.variants?.[0]?.sku || "N/A"
  const category = product.categories?.[0]?.name || product.collection?.title || "Equipment"
  
  const specs = {
    capacity: (product.metadata?.capacity as string) || "5,000 lbs",
    liftHeight: (product.metadata?.lift_height as string) || "189 in",
    fuelType: (product.metadata?.fuel_type as string) || "Electric",
    warranty: (product.metadata?.warranty as string) || "3 Years",
  }

  const features = [
    "Full maintenance history available",
    "Factory-certified technicians",
    "48-hour delivery available",
    "Flexible financing options",
    "Trade-in accepted",
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link to={"/$countryCode" as string} params={{ countryCode }} className="text-text-secondary hover:text-text-primary transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-4 h-4 text-text-muted" />
              <Link to={"/$countryCode/store" as string} params={{ countryCode }} className="text-text-secondary hover:text-text-primary transition-colors">
                Product Catalog
              </Link>
              <ChevronRight className="w-4 h-4 text-text-muted" />
              <span className="text-text-primary font-medium">{product.title}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-text-secondary border border-border rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
                Add to Compare
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Image Gallery & Description */}
          <div className="space-y-6">
            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-card">
              {images.length > 0 ? (
                <ImageGallery images={images} />
              ) : (
                <div className="aspect-square bg-slate-100 flex items-center justify-center">
                  <svg className="w-24 h-24 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Product Description</h2>
                <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  {brand}
                </span>
                <span className="text-sm text-text-muted">|</span>
                <span className="text-sm font-mono text-text-muted">SKU: {sku}</span>
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-3">{product.title}</h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-800 text-white text-sm font-medium rounded-full">
                  {category}
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                  In Stock
                </span>
              </div>
            </div>

            {/* Price & Ordering */}
            <div className="bg-surface rounded-xl border border-border p-6 mb-6 shadow-card">
              {isAuthenticated ? (
                <>
                  <div className="flex items-end justify-between mb-5">
                    <ProductPrice product={product} />
                    <p className="text-sm text-text-muted">Financing available</p>
                  </div>
                  
                  {/* Bulk Variant Table */}
                  {region && <BulkVariantTable product={product} region={region} />}
                </>
              ) : (
                <LockedPrice />
              )}
            </div>

            {/* Specs Grid */}
            <div className="bg-surface rounded-xl border border-border p-6 mb-6 shadow-card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Capacity</p>
                  <p className="text-lg font-semibold text-text-primary">{specs.capacity}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Lift Height</p>
                  <p className="text-lg font-semibold text-text-primary">{specs.liftHeight}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Fuel Type</p>
                  <p className="text-lg font-semibold text-text-primary">{specs.fuelType}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Warranty</p>
                  <p className="text-lg font-semibold text-text-primary">{specs.warranty}</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Why Buy From Us</h3>
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-10 bg-sidebar rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Need Help Choosing?</h2>
          <p className="text-sidebar-text mb-6">Our equipment specialists are ready to assist you</p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-6 py-3 bg-white text-sidebar font-medium rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
              Call 1-800-PROLIFT
            </button>
            <button className="px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors cursor-pointer">
              Live Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
