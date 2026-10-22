import { Link } from "@tanstack/react-router"
import { useCountryCode } from "@/lib/hooks/use-country-code"
import { ProLiftMark } from "@/components/prolift-mark"
import { useCategories } from "@/lib/hooks/use-categories"
import { POLICY_PAGES } from "@/lib/constants/policy-pages"

export const FOOTER_CATEGORY_FIELDS = "id,name,handle"
export const FOOTER_CATEGORY_PARAMS = { parent_category_id: "null", limit: 6 }

export function PublicFooter() {
  const countryCode = useCountryCode()
  const { data: categories = [] } = useCategories({
    fields: FOOTER_CATEGORY_FIELDS,
    queryParams: FOOTER_CATEGORY_PARAMS,
  })

  const equipmentLinks = [
    ...categories.map((category) => ({
      label: category.name,
      href: `/${countryCode}/categories/${category.handle}`,
    })),
    { label: "All Equipment", href: `/${countryCode}/store` },
  ]

  const policyLinks = POLICY_PAGES.map((policy) => ({
    label: policy.title,
    href: `/${countryCode}/${policy.handle}`,
  }))

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to={"/$countryCode" as string} params={{ countryCode }} className="flex items-center gap-2 mb-4">
              <ProLiftMark size={40} bg="#0f172a" color="#0d9488" />
              <div>
                <span className="font-bold text-lg text-white">ProLift</span>
                <span className="text-teal-400 text-xs font-semibold ml-0.5">PRO</span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your trusted partner for industrial material handling equipment. Serving businesses nationwide since 1987.
            </p>
          </div>

          {/* Equipment links */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Equipment
            </h3>
            <ul className="space-y-3">
              {equipmentLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy links */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Policies
            </h3>
            <ul className="space-y-3">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} ProLift Pro. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
