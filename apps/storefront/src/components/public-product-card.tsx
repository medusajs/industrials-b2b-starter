import { useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"

interface PublicProductCardProps {
  product: HttpTypes.StoreProduct
  isNew?: boolean
}

export function PublicProductCard({ product, isNew = false }: PublicProductCardProps) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"

  const thumbnail = product.thumbnail || product.images?.[0]?.url
  const sku = product.variants?.[0]?.sku || "N/A"
  const category = product.categories?.[0]?.name || product.type?.value || "Equipment"



  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
      {/* Image */}
      <a href={`/${countryCode}/products/${product.handle}`} className="block relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {isNew && (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-xs font-semibold text-white bg-teal-600 rounded">
            New
          </span>
        )}
        {/* Category badge overlaid */}
        <span className="absolute top-2 right-2 z-10 px-2 py-0.5 text-xs font-medium text-white bg-gray-800/80 rounded">
          {category}
        </span>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </a>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <a href={`/${countryCode}/products/${product.handle}`}>
          <h3 className="text-sm font-semibold text-gray-900 mb-1 hover:text-teal-600 transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>
        </a>
        
        {/* SKU */}
        <p className="text-xs text-gray-500 mb-3 font-mono">
          {sku}
        </p>

        {/* Actions - Sign in for pricing - push to bottom */}
        <div className="mt-auto">
          <a
            href={`/${countryCode}/account/login`}
            className="block w-full px-3 py-2 text-xs font-medium text-center text-teal-600 border border-teal-600 rounded hover:bg-teal-50 transition-colors"
          >
            Sign in for pricing
          </a>
        </div>
      </div>
    </div>
  )
}
