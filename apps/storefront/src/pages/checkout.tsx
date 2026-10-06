import { CartEmpty } from "@/components/cart"
import CheckoutProgress from "@/components/checkout-progress"
import { DashboardPageLayout } from "@/components/dashboard-page-layout"
import { StripeElementsProvider } from "@/components/stripe-elements-provider"
import { Loading } from "@/components/ui/loading"
import { useCart } from "@/lib/hooks/use-cart"
import { useCompanySetupStatus } from "@/lib/hooks/use-company-setup"
import { type CheckoutStep, CheckoutStepKey } from "@/lib/types/global"
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useParams,
} from "@tanstack/react-router"
import { lazy, Suspense, useCallback, useEffect, useMemo } from "react"

const DeliveryStep = lazy(() => import("@/components/checkout-delivery-step"))
const AddressStep = lazy(() => import("@/components/checkout-address-step"))
const PaymentStep = lazy(() => import("@/components/checkout-payment-step"))
const ReviewStep = lazy(() => import("@/components/checkout-review-step"))
const CheckoutSummary = lazy(() => import("@/components/checkout-summary"))

function CheckoutSetupBlocker({
  setupStatus,
}: {
  setupStatus: { steps: { key: string; label: string; completed: boolean; required_for_checkout: boolean }[] }
}) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"

  const missing = setupStatus.steps
    .filter((s) => !s.completed && s.required_for_checkout)
    .map((s) => s.label.toLowerCase())

  return (
    <DashboardPageLayout>
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Company Setup Required
        </h2>
        <p className="text-gray-600 mb-6">
          Before your team can place orders, a company admin needs to configure:{" "}
          {missing.join(", ")}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`/${countryCode}/settings?tab=addresses`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Go to Settings
          </a>
          <a
            href={`/${countryCode}/store`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </DashboardPageLayout>
  )
}

const Checkout = () => {
  const { step } = useLoaderData({
    from: "/$countryCode/checkout",
  })
  const { data: cart, isLoading: cartLoading } = useCart()
  const { data: setupStatus, isLoading: setupLoading } = useCompanySetupStatus()
  const location = useLocation()
  const navigate = useNavigate()

  const steps: CheckoutStep[] = useMemo(() => {
    return [
      {
        key: CheckoutStepKey.ADDRESSES,
        title: "Addresses",
        description: "Enter your shipping and billing addresses.",
        completed: !!(cart?.shipping_address && cart?.billing_address),
      },
      {
        key: CheckoutStepKey.DELIVERY,
        title: "Delivery",
        description: "Select a shipping method.",
        completed: !!cart?.shipping_methods?.length,
      },
      {
        key: CheckoutStepKey.PAYMENT,
        title: "Payment",
        description:
          "Select a payment method. You won't be charged until you place your order.",
        completed: !!cart?.payment_collection?.payment_sessions?.length,
      },
      {
        key: CheckoutStepKey.REVIEW,
        title: "Review",
        description: "Review your order details before placing your order.",
        completed: false,
      },
    ]
  }, [cart])

  const currentStepIndex = useMemo(
    () => steps.findIndex((s) => s.key === step),
    [step, steps]
  )

  const goToStep = useCallback((step: CheckoutStepKey) => {
    navigate({
      to: `${location.pathname}?step=${step}`,
      replace: true,
    })
  }, [location.pathname, navigate])

  useEffect(() => {
    if (!cart) {
      return
    }

    if (
      step !== CheckoutStepKey.ADDRESSES &&
      currentStepIndex >= 0 &&
      steps[0] &&
      !steps[0].completed
    ) {
      goToStep(CheckoutStepKey.ADDRESSES)
      return
    }

    if (
      step !== CheckoutStepKey.DELIVERY &&
      currentStepIndex >= 1 &&
      steps[1] &&
      !steps[1].completed
    ) {
      goToStep(CheckoutStepKey.DELIVERY)
      return
    }

    if (
      step !== CheckoutStepKey.PAYMENT &&
      currentStepIndex >= 2 &&
      steps[2] &&
      !steps[2].completed
    ) {
      goToStep(CheckoutStepKey.PAYMENT)
      return
    }
  }, [cart, steps, location, currentStepIndex, step, goToStep])

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      goToStep(steps[nextIndex].key)
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      goToStep(steps[prevIndex].key)
    }
  }

  const isPaymentOrReview =
    step === CheckoutStepKey.PAYMENT || step === CheckoutStepKey.REVIEW

  // Block checkout if checkout-required setup steps are incomplete
  if (!setupLoading && setupStatus && !setupStatus.checkout_ready) {
    return <CheckoutSetupBlocker setupStatus={setupStatus} />
  }

  return (
    <DashboardPageLayout className="flex flex-col gap-8">
      <CheckoutProgress
        steps={steps}
        currentStepIndex={currentStepIndex}
        handleStepChange={goToStep}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-24">
        <div className="flex flex-col gap-1 lg:col-span-2">
          <h2 className="text-zinc-900 text-xl">
            {steps[currentStepIndex]?.title}
          </h2>
          <p className="text-base font-medium text-zinc-600">
            {steps[currentStepIndex]?.description}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-zinc-900 text-xl">Order Summary</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-24">
        <div className="space-y-6 lg:col-span-2">
          <Suspense fallback={<Loading />}>
            {cartLoading && <Loading />}
            {cart && (
              <>
                {step === CheckoutStepKey.ADDRESSES && (
                  <AddressStep cart={cart} onNext={handleNext} />
                )}

                {step === CheckoutStepKey.DELIVERY && (
                  <DeliveryStep
                    cart={cart}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}

                {isPaymentOrReview && (
                  <StripeElementsProvider cart={cart}>
                    <div
                      style={{
                        visibility:
                          step !== CheckoutStepKey.PAYMENT
                            ? "hidden"
                            : "visible",
                        overflow:
                          step !== CheckoutStepKey.PAYMENT ? "hidden" : "auto",
                        height:
                          step !== CheckoutStepKey.PAYMENT ? 0 : "auto",
                      }}
                    >
                      <PaymentStep
                        cart={cart}
                        onNext={handleNext}
                        onBack={handleBack}
                      />
                    </div>
                    <div
                      style={{
                        visibility:
                          step !== CheckoutStepKey.REVIEW
                            ? "hidden"
                            : "visible",
                        overflow:
                          step !== CheckoutStepKey.REVIEW ? "hidden" : "auto",
                        height:
                          step !== CheckoutStepKey.REVIEW ? 0 : "auto",
                      }}
                    >
                      <ReviewStep cart={cart} onBack={handleBack} />
                    </div>
                  </StripeElementsProvider>
                )}
              </>
            )}
          </Suspense>
        </div>

        <Suspense fallback={<Loading />}>
          {cartLoading && <Loading />}
          {cart && <CheckoutSummary cart={cart} />}
          {!cart && !cartLoading && <CartEmpty />}
        </Suspense>
      </div>
    </DashboardPageLayout>
  )
}

export default Checkout
