import { Link, useLoaderData } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { ProductCard } from "@/components/product-card"
import { ChevronRight } from "@medusajs/icons"

interface CategoryPageData {
  category: HttpTypes.StoreProductCategory
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  countryCode: string
}

export function CategoryPage() {
  const loaderData = useLoaderData({ strict: false }) as CategoryPageData | undefined
  const { category, products = [], region, countryCode = "us" } = loaderData || {}

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Category not found</h1>
          <p className="text-text-secondary mb-6">The category you're looking for doesn't exist.</p>
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
              <span className="text-text-primary font-medium">{category.name}</span>
            </div>

            {/* Actions */}
            <button className="px-5 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors cursor-pointer">
              Request Bulk Quote
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8">
        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-text-secondary max-w-2xl">{category.description}</p>
          )}
          <p className="text-sm text-text-muted mt-2">{products.length} products</p>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                regionId={region?.id || ""}
                countryCode={countryCode}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <p className="text-text-secondary mb-4">No products in this category</p>
            <Link 
              to={"/$countryCode/store" as string} params={{ countryCode }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryPage
