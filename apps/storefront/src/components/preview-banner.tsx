import { useState } from "react"
import { useParams } from "@tanstack/react-router"
import { useAuth } from "@/lib/hooks/use-auth"

const DEMO_EMAIL = import.meta.env.VITE_PREVIEW_DEMO_EMAIL as string | undefined
const DEMO_PASSWORD = import.meta.env.VITE_PREVIEW_DEMO_PASSWORD as string | undefined

interface PreviewBannerProps {
  forceShow?: boolean
}

export function PreviewBanner({ forceShow = false }: PreviewBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"

  if (!forceShow || isDismissed) {
    return null
  }

  const handleDemoLogin = async () => {
    if (!DEMO_EMAIL || !DEMO_PASSWORD) return
    setIsLoggingIn(true)
    setError(null)
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD)
    } catch {
      setError("Could not sign in to the demo account. Please try again.")
      setIsLoggingIn(false)
    }
  }

  const hasCredentials = Boolean(DEMO_EMAIL && DEMO_PASSWORD)

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0f172a] border-b border-teal-500/30 pr-[var(--removed-body-scroll-bar-size,0px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Preview pill */}
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 text-[11px] font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Preview
            </span>

            <p className="text-sm text-gray-300 truncate">
              <span className="text-white font-medium">Exploring the ProLift starter?</span>
              {" "}
              <span className="hidden sm:inline text-gray-400">
                Create your own account to unlock the full experience — or try the demo account to see the portal right away.
              </span>
              <span className="sm:hidden text-gray-400">Try the demo to see the full portal.</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {error && (
              <span className="hidden md:block text-xs text-red-400">{error}</span>
            )}

            {hasCredentials ? (
              <button
                onClick={handleDemoLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Access demo account
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <a
                href={`/${countryCode}/account/register`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Create an account
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            )}

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <p className="md:hidden mt-1.5 text-xs text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}
