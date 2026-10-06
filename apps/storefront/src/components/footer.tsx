import { Link, useParams } from "@tanstack/react-router"

export function Footer() {
  const params = useParams({ strict: false })
  const countryCode = (params as { countryCode?: string })?.countryCode || "us"
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Products
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/$countryCode/categories/$handle"
                  params={{ countryCode, handle: "forklifts" }}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Forklifts
                </Link>
              </li>
              <li>
                <Link
                  to="/$countryCode/categories/$handle"
                  params={{ countryCode, handle: "material-handlers" }}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Material Handlers
                </Link>
              </li>
              <li>
                <Link
                  to="/$countryCode/categories/$handle"
                  params={{ countryCode, handle: "parts-accessories" }}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Parts
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Shipping
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Returns
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            {currentYear} ForkliftPro. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
