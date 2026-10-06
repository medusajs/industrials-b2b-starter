import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { sdk } from "@/lib/utils/sdk"

interface TourStep {
  target: string
  title: string
  description: string
  placement: "right" | "bottom" | "left" | "top"
  adminOnly?: boolean
}

const isStripeEnabled = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='dashboard']",
    title: "Dashboard",
    description:
      "Your central hub. View key metrics, recent activity, and quick actions at a glance.",
    placement: "right",
  },
  {
    target: "[data-tour='catalog']",
    title: "Product Catalog",
    description:
      "Browse and search the full equipment catalog. Add items to your cart or request a quote.",
    placement: "right",
  },
  {
    target: "[data-tour='cart']",
    title: "Cart",
    description:
      "Review items before checkout. Adjust quantities, apply promotions, and proceed to order.",
    placement: "right",
  },
  {
    target: "[data-tour='orders']",
    title: "Order History",
    description:
      "Track all your orders in one place. View statuses, details, and reorder past purchases.",
    placement: "right",
  },
  {
    target: "[data-tour='quotes']",
    title: "Quotes",
    description:
      "Request and manage quotes for bulk or custom orders. Negotiate pricing with the sales team.",
    placement: "right",
  },
  {
    target: "[data-tour='employees']",
    title: "Employees",
    description:
      "Manage your team. Invite employees, set spending limits, and control access to the portal.",
    placement: "right",
    adminOnly: true,
  },
  {
    target: "[data-tour='settings']",
    title: "Settings",
    description: isStripeEnabled
      ? "Configure your company's addresses, payment methods, and account preferences."
      : "Configure your company's addresses and account preferences.",
    placement: "right",
  },
  {
    target: "[data-tour='setup-banner']",
    title: "Getting Started",
    description: isStripeEnabled
      ? "Complete these setup steps to unlock checkout. Add addresses, a payment method, and invite your team."
      : "Complete these setup steps to unlock checkout. Add addresses and invite your team.",
    placement: "bottom",
    adminOnly: true,
  },
]

interface TooltipPosition {
  top: number
  left: number
}

function getTooltipPosition(
  rect: DOMRect,
  placement: TourStep["placement"],
  tooltipWidth: number,
  tooltipHeight: number
): TooltipPosition {
  const gap = 16

  switch (placement) {
    case "right":
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: rect.right + gap,
      }
    case "left":
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: rect.left - tooltipWidth - gap,
      }
    case "bottom":
      return {
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2 - tooltipWidth / 2,
      }
    case "top":
      return {
        top: rect.top - tooltipHeight - gap,
        left: rect.left + rect.width / 2 - tooltipWidth / 2,
      }
  }
}

function getArrowClass(placement: TourStep["placement"]): string {
  switch (placement) {
    case "right":
      return "left-0 top-1/2 -translate-x-full -translate-y-1/2 border-r-white border-t-transparent border-b-transparent border-l-transparent border-8"
    case "left":
      return "right-0 top-1/2 translate-x-full -translate-y-1/2 border-l-white border-t-transparent border-b-transparent border-r-transparent border-8"
    case "bottom":
      return "top-0 left-1/2 -translate-y-full -translate-x-1/2 border-b-white border-l-transparent border-r-transparent border-t-transparent border-8"
    case "top":
      return "bottom-0 left-1/2 translate-y-full -translate-x-1/2 border-t-white border-l-transparent border-r-transparent border-b-transparent border-8"
  }
}

export function OnboardingTour() {
  const { customer, isAdmin, refetch } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const filteredSteps = TOUR_STEPS.filter(
    (step) => !step.adminOnly || isAdmin
  )

  const shouldShowTour = useCallback(() => {
    if (!customer) return false
    const meta = customer.metadata as Record<string, unknown> | null
    return !meta?.onboarding_completed
  }, [customer])

  useEffect(() => {
    if (shouldShowTour()) {
      const timer = setTimeout(() => setIsVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [shouldShowTour])

  const updateTargetRect = useCallback(() => {
    if (!isVisible || currentStep >= filteredSteps.length) return

    const step = filteredSteps[currentStep]
    const el = document.querySelector(step.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)

      requestAnimationFrame(() => {
        if (tooltipRef.current) {
          const tooltipRect = tooltipRef.current.getBoundingClientRect()
          const pos = getTooltipPosition(
            rect,
            step.placement,
            tooltipRect.width,
            tooltipRect.height
          )
          // Clamp to viewport
          pos.top = Math.max(16, Math.min(pos.top, window.innerHeight - tooltipRect.height - 16))
          pos.left = Math.max(16, Math.min(pos.left, window.innerWidth - tooltipRect.width - 16))
          setTooltipPosition(pos)
        }
      })
    } else {
      // Target not found, skip to next step
      if (currentStep < filteredSteps.length - 1) {
        setCurrentStep((prev) => prev + 1)
      }
    }
  }, [isVisible, currentStep, filteredSteps])

  useEffect(() => {
    updateTargetRect()
    window.addEventListener("resize", updateTargetRect)
    window.addEventListener("scroll", updateTargetRect, true)
    return () => {
      window.removeEventListener("resize", updateTargetRect)
      window.removeEventListener("scroll", updateTargetRect, true)
    }
  }, [updateTargetRect])

  const completeTour = useCallback(async () => {
    setIsAnimating(true)
    setTimeout(() => setIsVisible(false), 300)

    try {
      await sdk.store.customer.update({
        metadata: {
          ...(customer?.metadata as Record<string, unknown> | undefined),
          onboarding_completed: true,
        },
      })
      await refetch()
    } catch (e) {
      console.error("Failed to save onboarding state:", e)
    }
  }, [customer, refetch])

  const goToStep = useCallback(
    (step: number) => {
      if (step >= filteredSteps.length) {
        completeTour()
        return
      }
      setCurrentStep(step)
    },
    [filteredSteps.length, completeTour]
  )

  if (!isVisible || !targetRect) return null

  const step = filteredSteps[currentStep]
  const spotlightPadding = 8

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}
    >
      {/* Overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-spotlight">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - spotlightPadding}
              y={targetRect.top - spotlightPadding}
              width={targetRect.width + spotlightPadding * 2}
              height={targetRect.height + spotlightPadding * 2}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-spotlight)"
        />
      </svg>

      {/* Spotlight border ring */}
      <div
        className="absolute rounded-xl ring-2 ring-teal-400 ring-offset-2 transition-all duration-500 ease-in-out"
        style={{
          top: targetRect.top - spotlightPadding,
          left: targetRect.left - spotlightPadding,
          width: targetRect.width + spotlightPadding * 2,
          height: targetRect.height + spotlightPadding * 2,
          pointerEvents: "none",
        }}
      />

      {/* Clickable overlay to dismiss */}
      <div
        className="absolute inset-0"
        onClick={completeTour}
        style={{ pointerEvents: "auto" }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-xl shadow-2xl p-5 w-[340px] transition-all duration-500 ease-in-out"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          pointerEvents: "auto",
        }}
      >
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 ${getArrowClass(step.placement)}`}
        />

        {/* Step counter */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
            Step {currentStep + 1} of {filteredSteps.length}
          </span>
          <button
            onClick={completeTour}
            className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
          >
            Skip tour
          </button>
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          {step.title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Progress dots and navigation */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {filteredSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-6 bg-teal-500"
                    : i < currentStep
                      ? "w-1.5 bg-teal-300"
                      : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => goToStep(currentStep - 1)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              onClick={() => goToStep(currentStep + 1)}
              className="px-4 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
            >
              {currentStep === filteredSteps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
