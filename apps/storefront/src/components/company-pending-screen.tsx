import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"

interface CompanyPendingScreenProps {
  companyName?: string
  status: string
}

const STATUS_CONFIG: Record<
  string,
  { title: string; description: string; icon: "clock" | "pause" | "shield" }
> = {
  pending: {
    title: "Your account is under review",
    description:
      "Our team is reviewing your company registration. Once approved, you and your team will have full access to browse products, place orders, and manage your account.",
    icon: "clock",
  },
  inactive: {
    title: "Your account has been deactivated",
    description:
      "Your company account is currently inactive. Please reach out to our support team if you believe this is an error or would like to reactivate your account.",
    icon: "pause",
  },
  suspended: {
    title: "Your account has been suspended",
    description:
      "Your company account has been suspended. Please contact our support team for more information about restoring access.",
    icon: "shield",
  },
}

function StatusIcon({ type }: { type: "clock" | "pause" | "shield" }) {
  if (type === "clock") {
    return (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  }
  if (type === "pause") {
    return (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="10" y1="15" x2="10" y2="9" />
        <line x1="14" y1="15" x2="14" y2="9" />
      </svg>
    )
  }
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export function CompanyPendingScreen({
  companyName,
  status,
}: CompanyPendingScreenProps) {
  const { logout } = useAuth()
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
            <StatusIcon type={config.icon} />
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {config.title}
          </h1>

          {companyName && (
            <p className="text-sm font-medium text-gray-500 mb-4">
              {companyName}
            </p>
          )}

          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            {config.description}
          </p>

          {status === "pending" && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <p className="text-xs text-gray-500 leading-relaxed">
                You will receive an email notification once your account has been
                reviewed. This typically takes 1-2 business days.
              </p>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
