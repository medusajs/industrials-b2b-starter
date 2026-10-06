import { Link, useParams } from "@tanstack/react-router"
import { ProLiftMark } from "@/components/prolift-mark"

export function PublicFooter() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"

  const equipmentLinks = [
    { label: "Electric Forklifts", href: `/${countryCode}/store` as string },
    { label: "IC Forklifts", href: `/${countryCode}/store` as string },
    { label: "Reach Trucks", href: `/${countryCode}/store` as string },
    { label: "Order Pickers", href: `/${countryCode}/store` as string },
  ]

  const companyLinks = [
    { label: "About Us", href: `/${countryCode}/about` as string },
    { label: "Careers", href: `/${countryCode}/careers` as string },
  ]

  const supportLinks = [
    { label: "Service & Parts", href: `/${countryCode}/service` as string },
    { label: "Safety Resources", href: `/${countryCode}/safety` as string },
  ]

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
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
                <li key={link.label}>
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

          {/* Company links */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
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

          {/* Support links */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
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
            <div className="flex items-center gap-6">
              <Link
                to={`/${countryCode}/privacy` as string}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to={`/${countryCode}/terms` as string}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
