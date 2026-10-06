import PaymentContainer from "@/components/payment-container"
import StripeCardContainer from "@/components/stripe-card-container"
import { Button } from "@/components/ui/button"
import {
  useCartPaymentMethods,
  useInitiateCartPaymentSession,
} from "@/lib/hooks/use-checkout"
import {
  isStripe as isStripeFunc,
  getActivePaymentSession,
  isPaidWithGiftCard,
} from "@/lib/utils/checkout"
import { useAuth } from "@/lib/hooks/use-auth"
import { sdk } from "@/lib/utils/sdk"
import { getStoredCart } from "@/lib/utils/cart"
import { queryKeys } from "@/lib/utils/query-keys"
import { HttpTypes } from "@medusajs/types"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { CreditCard } from "@medusajs/icons"

interface SavedPaymentMethod {
  id: string
  data: {
    id: string
    card?: {
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    }
    type?: string
    [key: string]: unknown
  }
}

interface PaymentStepProps {
  cart: HttpTypes.StoreCart
  onNext: () => void
  onBack: () => void
  onPaymentDetailsComplete?: (complete: boolean) => void
}

function cardBrandLabel(brand: string): string {
  const brands: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  }
  return brands[brand] || brand.charAt(0).toUpperCase() + brand.slice(1)
}

const useInitiateCompanyPaymentSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      provider_id,
      payment_method_id,
    }: {
      provider_id: string
      payment_method_id: string
    }) => {
      const cartId = getStoredCart()
      if (!cartId) throw new Error("No cart found")

      const response = await sdk.client.fetch<{ payment_session: unknown }>(
        "/store/company/initiate-checkout-session",
        {
          method: "POST",
          body: {
            cart_id: cartId,
            provider_id,
            payment_method_id,
          },
        }
      )
      return response.payment_session
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ predicate: queryKeys.cart.predicate })
    },
  })
}

const PaymentStep = ({
  cart,
  onNext,
  onBack,
  onPaymentDetailsComplete,
}: PaymentStepProps) => {
  const { employee } = useAuth()
  const { data: availablePaymentMethods = [] } = useCartPaymentMethods({
    region_id: cart.region?.id,
  })
  const initiatePaymentSessionMutation = useInitiateCartPaymentSession()
  const initiateCompanySessionMutation = useInitiateCompanyPaymentSession()

  const { data: savedPaymentMethods = [] } = useQuery({
    queryKey: ["company-checkout-payment-methods"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ payment_methods: SavedPaymentMethod[] }>(
        "/store/company/checkout-payment-methods",
        { method: "GET" }
      )
      return response.payment_methods
    },
    enabled: !!employee,
  })

  const hasSavedMethods = savedPaymentMethods.length > 0
  const activeSession = getActivePaymentSession(cart)

  const [error, setError] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<string | null>(null)
  const [isPaymentDetailsComplete, setIsPaymentDetailsComplete] =
    useState(false)

  const isStripe = isStripeFunc(selectedPaymentMethod)
  const paidByGiftcard = isPaidWithGiftCard(cart)

  const isInitiating =
    initiatePaymentSessionMutation.isPending || initiateCompanySessionMutation.isPending

  const initiatePaymentSession = useCallback(
    async (method: string) => {
      initiatePaymentSessionMutation.mutateAsync(
        { provider_id: method },
        {
          onError: (error) => {
            setError(
              error instanceof Error ? error.message : "An error occurred"
            )
          },
        }
      )
    },
    [initiatePaymentSessionMutation]
  )

  const initiateCompanySession = useCallback(
    async (providerId: string, paymentMethodId: string) => {
      initiateCompanySessionMutation.mutateAsync(
        { provider_id: providerId, payment_method_id: paymentMethodId },
        {
          onError: (error) => {
            setError(
              error instanceof Error ? error.message : "An error occurred"
            )
          },
        }
      )
    },
    [initiateCompanySessionMutation]
  )

  const handlePaymentMethodChange = useCallback(
    async (method: string) => {
      setError(null)
      setSelectedPaymentMethod(method)
      setSelectedSavedMethodId(null)
      setIsPaymentDetailsComplete(false)
      initiatePaymentSession(method)
    },
    [initiatePaymentSession]
  )

  const handleSavedMethodSelect = useCallback(
    async (savedMethod: SavedPaymentMethod) => {
      setError(null)
      const stripeProviderId = availablePaymentMethods.find((m) =>
        isStripeFunc(m.id)
      )?.id
      if (!stripeProviderId) return

      setSelectedPaymentMethod(stripeProviderId)
      setSelectedSavedMethodId(savedMethod.data.id)
      setIsPaymentDetailsComplete(true)
      onPaymentDetailsComplete?.(true)
      initiateCompanySession(stripeProviderId, savedMethod.data.id)
    },
    [availablePaymentMethods, initiateCompanySession, onPaymentDetailsComplete]
  )

  const hasNonPendingSession =
    cart?.payment_collection?.payment_sessions?.some(
      (s) => s.status !== "pending" && isStripeFunc(s.provider_id)
    ) && !activeSession

  // Auto-select first saved method for company employees
  useEffect(() => {
    if (hasSavedMethods && !selectedSavedMethodId && !selectedPaymentMethod) {
      handleSavedMethodSelect(savedPaymentMethods[0])
    }
  }, [hasSavedMethods, savedPaymentMethods, selectedSavedMethodId, selectedPaymentMethod, handleSavedMethodSelect])

  // Fallback: auto-select first payment method if no saved methods
  useEffect(() => {
    if (!hasSavedMethods && !selectedPaymentMethod && availablePaymentMethods?.length > 0) {
      const firstMethod = availablePaymentMethods[0]
      if (firstMethod) {
        setSelectedPaymentMethod(firstMethod.id)
        handlePaymentMethodChange(firstMethod.id)
      }
    }
  }, [
    hasSavedMethods,
    availablePaymentMethods,
    selectedPaymentMethod,
    handlePaymentMethodChange,
  ])

  useEffect(() => {
    if (hasNonPendingSession && selectedPaymentMethod) {
      if (selectedSavedMethodId) {
        initiateCompanySession(selectedPaymentMethod, selectedSavedMethodId)
      } else {
        initiatePaymentSession(selectedPaymentMethod)
      }
    }
  }, [hasNonPendingSession, selectedPaymentMethod, selectedSavedMethodId, initiatePaymentSession, initiateCompanySession])

  const handlePaymentComplete = useCallback(
    (complete: boolean) => {
      setIsPaymentDetailsComplete(complete)
      onPaymentDetailsComplete?.(complete)
    },
    [onPaymentDetailsComplete]
  )

  const handleSubmit = useCallback(async () => {
    if (!selectedPaymentMethod) return

    if (!activeSession) {
      if (selectedSavedMethodId) {
        await initiateCompanySession(selectedPaymentMethod, selectedSavedMethodId)
      } else {
        await initiatePaymentSession(selectedPaymentMethod)
      }
    }

    onNext()
  }, [selectedPaymentMethod, activeSession, onNext, initiatePaymentSession, initiateCompanySession, selectedSavedMethodId])

  const canProceed = hasSavedMethods && selectedSavedMethodId
    ? !!activeSession
    : isStripe
      ? isPaymentDetailsComplete && !!activeSession
      : !!selectedPaymentMethod || paidByGiftcard

  return (
    <div className="flex flex-col gap-8">
      {!paidByGiftcard && hasSavedMethods && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-700">Select a company payment method</p>
          {savedPaymentMethods.map((method) => {
            const card = method.data?.card
            const isSelected = selectedSavedMethodId === method.data.id
            return (
              <button
                key={method.data.id ?? method.id}
                type="button"
                onClick={() => handleSavedMethodSelect(method)}
                className={`w-full flex items-center gap-4 p-4 border rounded-lg transition-colors text-left ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="w-10 h-7 bg-zinc-100 rounded flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900">
                    {card ? cardBrandLabel(card.brand) : "Card"} ending in {card?.last4 || "****"}
                  </p>
                  {card && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Expires {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                    </p>
                  )}
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? "border-zinc-900" : "border-zinc-300"
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {!paidByGiftcard && !hasSavedMethods && (availablePaymentMethods?.length ?? 0) > 0 && (
        <>
          {availablePaymentMethods.map((paymentMethod) => (
            <div key={paymentMethod.id}>
              <PaymentContainer
                paymentProviderId={paymentMethod.id}
                selectedPaymentOptionId={selectedPaymentMethod}
                onClick={() => handlePaymentMethodChange(paymentMethod.id)}
              >
                {isStripeFunc(paymentMethod.id) &&
                  selectedPaymentMethod === paymentMethod.id && (
                    <StripeCardContainer
                      cart={cart}
                      onPaymentDetailsComplete={handlePaymentComplete}
                    />
                  )}
              </PaymentContainer>
            </div>
          ))}
        </>
      )}

      {paidByGiftcard && (
        <div className="flex flex-col w-1/3">
          <p className="text-base font-semibold text-zinc-900 mb-1">
            Payment method
          </p>
          <p
            className="text-base font-semibold text-zinc-600"
            data-testid="payment-method-summary"
          >
            Gift card
          </p>
        </div>
      )}

      {error && (
        <div
          className="text-rose-900 text-sm"
          data-testid="payment-method-error-message"
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={isInitiating}
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canProceed || isInitiating}
          data-testid="submit-payment-button"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default PaymentStep
