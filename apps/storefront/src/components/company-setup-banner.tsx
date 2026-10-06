import { useParams, useNavigate } from "@tanstack/react-router"
import {
  useCompanySetupStatus,
  type CompanySetupStep,
} from "@/lib/hooks/use-company-setup"
import { useAuth } from "@/lib/hooks/use-auth"

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}

function StepIcon({ index }: { index: number }) {
  return (
    <span className="text-sm font-semibold text-white">{index + 1}</span>
  )
}

function SetupStepCard({
  step,
  index,
  countryCode,
}: {
  step: CompanySetupStep
  index: number
  countryCode: string
}) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate({ to: `/${countryCode}${step.link}` as string })}
      className={`w-full text-left flex items-start gap-4 p-4 rounded-lg border transition-all ${
        step.completed
          ? "border-green-200 bg-green-50/50"
          : "border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm cursor-pointer"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          step.completed ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        {step.completed ? <CheckIcon /> : <StepIcon index={index} />}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            step.completed
              ? "text-green-700 line-through"
              : "text-gray-900"
          }`}
        >
          {step.label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
      </div>
      {!step.completed && (
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </button>
  )
}

export function CompanySetupBanner() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"
  const { isAdmin } = useAuth()
  const { data: setupStatus, isLoading } = useCompanySetupStatus()

  if (isLoading || !setupStatus || setupStatus.completed || !isAdmin) {
    return null
  }

  const progressPercent = Math.round(
    (setupStatus.completed_count / setupStatus.total_count) * 100
  )

  return (
    <div data-tour="setup-banner" className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Complete your company setup
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {isAdmin
                ? "Finish these steps so your team can start placing orders."
                : "Your company admin needs to complete setup before orders can be placed."}
            </p>
          </div>
          <span className="text-sm font-medium text-gray-500 tabular-nums">
            {setupStatus.completed_count}/{setupStatus.total_count}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {setupStatus.steps.map((step, index) => (
          <SetupStepCard
            key={step.key}
            step={step}
            index={index}
            countryCode={countryCode}
          />
        ))}
      </div>
    </div>
  )
}

export default CompanySetupBanner
