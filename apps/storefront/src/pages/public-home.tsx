import { useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { PublicProductCard } from "@/components/public-product-card"

interface PublicHomePageProps {
  products: HttpTypes.StoreProduct[]
  categories: HttpTypes.StoreProductCategory[]
}

export function PublicHomePage({ products = [], categories = [] }: PublicHomePageProps) {
  // Don't use useParams during SSR - use a safe default
  let countryCode = "us"
  try {
    const params = useParams({ strict: false }) as { countryCode?: string }
    countryCode = params.countryCode || "us"
  } catch {
    // During SSR, useParams might fail - use default
  }

  // Stats data
  const stats = [
    { value: "2,500+", label: "Units Sold Annually" },
    { value: "98%", label: "Customer Satisfaction" },
    { value: "48 hrs", label: "Avg. Quote Turnaround" },
    { value: "37", label: "Years in Business" },
  ]

  // Map category handles to icons
  const categoryIcons: Record<string, React.ReactNode> = {
    "forklift-parts": (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    "safety-equipment": (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    "attachments": (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    "warehouse-equipment": (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    "material-handling": (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    "operator-accessories": (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  }

  const defaultIcon = (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )

  // Why choose us features
  const features = [
    {
      title: "Certified Equipment",
      description: "Every unit undergoes rigorous inspection and meets OSHA safety standards before delivery.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Nationwide Delivery",
      description: "Direct-to-dock delivery across all 50 states with real-time shipment tracking.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      title: "Fast Quoting",
      description: "Receive custom fleet pricing within 48 hours. Volume discounts available.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Dedicated Accounts",
      description: "Assigned account managers, employee access controls, and centralized billing.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center bg-slate-900 overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/70 z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600/20 border border-teal-500/30 rounded-full mb-6">
              <span className="text-sm font-medium text-teal-400">
                Trusted by 1,200+ businesses nationwide
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Industrial-Grade Material Handling Equipment
            </h1>

            {/* Subtext */}
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Forklifts, reach trucks, and material handlers from the brands you trust. 
              Get custom fleet pricing and dedicated account management.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <a
                href={`/${countryCode}/store`}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Browse Equipment
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>

            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-teal-600 mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Categories */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Equipment Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              From compact warehouse units to heavy-duty outdoor machines, we stock a full range of material handling equipment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`/${countryCode}/store?category=${category.id}`}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-teal-200 transition-all group"
              >
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                  {categoryIcons[category.handle ?? ""] ?? defaultIcon}
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                  <span className="text-sm text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity mr-1">Browse</span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Equipment */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Featured Equipment
              </h2>
              <p className="text-lg text-gray-600">
                Popular models from trusted manufacturers
              </p>
            </div>
            <a
              href={`/${countryCode}/store`}
              className="inline-flex items-center gap-2 text-teal-600 font-medium hover:text-teal-700 transition-colors"
            >
              View all
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 4).map((product, index) => (
                <PublicProductCard
                  key={product.id}
                  product={product}
                  isNew={index === 0 || index === 3}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                    <div className="h-5 bg-gray-100 rounded w-3/4 animate-pulse" />
                    <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Businesses Choose ProLift Pro
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade procurement backed by decades of industry expertise
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center sm:text-left">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="border-t border-slate-200" />

      {/* CTA Section */}
      <section className="bg-slate-900 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Equip Your Operation?
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Create a free business account to access fleet pricing, manage orders, and streamline procurement for your team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`/${countryCode}/account/register`}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Create Account
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href={`/${countryCode}/account/login`}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white border-2 border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="w-full h-px bg-slate-700" />
    </div>
  )
}
