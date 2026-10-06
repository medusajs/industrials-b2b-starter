import { useState, useEffect, useMemo, useCallback } from "react"
import { Link, useParams, useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/lib/hooks/use-auth"
import {
  useOrder,
  usePayOrder,
  useUpdateOrderAddress,
  useOrderShippingOptions,
  useSetOrderShippingMethod,
  useInitOrderPaymentSession,
} from "@/lib/hooks/use-orders"
import { useCartPaymentMethods } from "@/lib/hooks/use-checkout"
import { DashboardPageLayout } from "@/components/dashboard-page-layout"
import { Thumbnail } from "@/components/ui/thumbnail"
import { Price } from "@/components/ui/price"
import { Button } from "@/components/ui/button"
import Address from "@/components/address"
import AddressForm from "@/components/address-form"
import PaymentContainer from "@/components/payment-container"
import { formatOrderId } from "@/lib/utils/order"
import { AddressFormData } from "@/lib/types/global"
import { sdk } from "@/lib/utils/sdk"
import { useQuery } from "@tanstack/react-query"
import {
  ShoppingBag,
  CurrencyDollar,
  ArrowPath,
  CheckCircleSolid,
  ArrowLeft,
  Check,
  MapPin,
  CreditCard,
} from "@medusajs/icons"
import { toast } from "sonner"

type OrderPaymentStep = "address" | "shipping" | "payment" | "review"

interface CompanyAddressData {
  id: string
  name: string
  first_name: string
  last_name: string
  company_name: string | null
  address_1: string
  address_2: string | null
  city: string
  province: string | null
  postal_code: string
  country_code: string
  phone: string | null
}

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

function CompanyAddressSelector({
  addresses,
  selectedId,
  onSelect,
}: {
  addresses: CompanyAddressData[]
  selectedId: string | null
  onSelect: (addr: CompanyAddressData) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Select a company address</p>
      {addresses.map((addr) => {
        const isSelected = selectedId === addr.id
        return (
          <button
            key={addr.id}
            type="button"
            onClick={() => onSelect(addr)}
            className={`w-full flex items-start gap-4 p-4 border rounded-lg transition-colors text-left ${
              isSelected
                ? "border-zinc-900 bg-zinc-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{addr.name}</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {addr.first_name} {addr.last_name}
                {addr.company_name ? ` - ${addr.company_name}` : ""}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {addr.address_1}
                {addr.address_2 ? `, ${addr.address_2}` : ""}
                , {addr.city}
                {addr.province ? `, ${addr.province}` : ""}
                {" "}{addr.postal_code}, {addr.country_code.toUpperCase()}
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              isSelected ? "border-zinc-900" : "border-gray-300"
            }`}>
              {isSelected && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function OrderPaymentPage() {
  const params = useParams({ strict: false }) as { countryCode?: string; orderId?: string }
  const countryCode = params.countryCode || "us"
  const orderId = params.orderId || ""
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, employee } = useAuth()

  const { data: order, isLoading: orderLoading, refetch: refetchOrder } = useOrder({
    order_id: orderId,
    fields:
      "*items,*items.variant,*items.product,*shipping_address,*billing_address,*shipping_methods,*payment_collections,*payment_collections.payment_sessions,region_id,currency_code,total,subtotal,item_subtotal,shipping_total,tax_total,discount_total",
  })

  const { data: availablePaymentMethods = [] } = useCartPaymentMethods({
    region_id: order?.region_id ?? undefined,
  })

  const { data: shippingOptions = [] } = useOrderShippingOptions({ orderId })

  // Fetch company addresses for B2B employees
  const { data: companyAddresses = [] } = useQuery({
    queryKey: ["company-addresses"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ addresses: CompanyAddressData[] }>(
        "/store/company/addresses",
        { method: "GET" }
      )
      return response.addresses
    },
    enabled: !!employee,
  })

  // Fetch saved payment methods for B2B employees
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

  const hasCompanyAddresses = companyAddresses.length > 0 && !!employee
  const hasSavedPaymentMethods = savedPaymentMethods.length > 0

  const updateAddressMutation = useUpdateOrderAddress()
  const setShippingMethodMutation = useSetOrderShippingMethod()
  const initPaymentSessionMutation = useInitOrderPaymentSession()
  const payOrderMutation = usePayOrder()

  // Determine what's missing
  const hasShippingAddress = !!(
    order?.shipping_address?.address_1 &&
    order?.shipping_address?.city &&
    order?.shipping_address?.country_code
  )
  const hasShippingMethod = !!(order?.shipping_methods && order.shipping_methods.length > 0)
  const hasPaymentSession = !!(
    order?.payment_collections?.[0]?.payment_sessions &&
    order.payment_collections[0].payment_sessions.length > 0
  )

  const determineCurrentStep = useCallback((): OrderPaymentStep => {
    if (!hasShippingAddress) return "address"
    if (!hasShippingMethod) return "shipping"
    if (!hasPaymentSession) return "payment"
    return "review"
  }, [hasShippingAddress, hasShippingMethod, hasPaymentSession])

  const [currentStep, setCurrentStep] = useState<OrderPaymentStep>("address")

  useEffect(() => {
    if (order) {
      setCurrentStep(determineCurrentStep())
    }
  }, [order, determineCurrentStep])

  // Address state
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [isShippingAddressValid, setIsShippingAddressValid] = useState(false)
  const [isBillingAddressValid, setIsBillingAddressValid] = useState(false)
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string | null>(null)
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null)
  const [shippingAddress, setShippingAddress] = useState<AddressFormData>({
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    postal_code: "",
    province: "",
    country_code: countryCode,
    phone: "",
  })
  const [billingAddress, setBillingAddress] = useState<AddressFormData>({
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    postal_code: "",
    province: "",
    country_code: countryCode,
    phone: "",
  })

  // Shipping method state
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>("")

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const [selectedSavedPaymentId, setSelectedSavedPaymentId] = useState<string | null>(null)

  function applyCompanyAddress(
    addr: CompanyAddressData,
    setter: React.Dispatch<React.SetStateAction<AddressFormData>>
  ) {
    setter({
      first_name: addr.first_name,
      last_name: addr.last_name,
      company: addr.company_name || "",
      address_1: addr.address_1,
      address_2: addr.address_2 || "",
      city: addr.city,
      postal_code: addr.postal_code,
      province: addr.province || "",
      country_code: addr.country_code,
      phone: addr.phone || "",
    })
  }

  const handleSelectShippingAddress = (addr: CompanyAddressData) => {
    setSelectedShippingAddressId(addr.id)
    applyCompanyAddress(addr, setShippingAddress)
    setIsShippingAddressValid(true)
    if (sameAsBilling) {
      setSelectedBillingAddressId(addr.id)
    }
  }

  const handleSelectBillingAddress = (addr: CompanyAddressData) => {
    setSelectedBillingAddressId(addr.id)
    applyCompanyAddress(addr, setBillingAddress)
    setIsBillingAddressValid(true)
  }

  // Auto-select first company address
  useEffect(() => {
    if (hasCompanyAddresses && !selectedShippingAddressId) {
      const first = companyAddresses[0]
      handleSelectShippingAddress(first)
    }
  }, [hasCompanyAddresses, companyAddresses])

  // Initialize form with order data (for non-B2B or fallback)
  useEffect(() => {
    if (hasCompanyAddresses) return

    const companyName = employee?.company?.name || ""
    
    if (order?.shipping_address?.address_1) {
      setShippingAddress({
        first_name: order.shipping_address.first_name || "",
        last_name: order.shipping_address.last_name || "",
        company: order.shipping_address.company || "",
        address_1: order.shipping_address.address_1 || "",
        address_2: order.shipping_address.address_2 || "",
        city: order.shipping_address.city || "",
        postal_code: order.shipping_address.postal_code || "",
        province: order.shipping_address.province || "",
        country_code: order.shipping_address.country_code || countryCode,
        phone: order.shipping_address.phone || "",
      })
    } else if (order && !hasShippingAddress) {
      setShippingAddress((prev) => ({
        ...prev,
        company: companyName,
      }))
    }
    
    if (order?.billing_address?.address_1) {
      setBillingAddress({
        first_name: order.billing_address.first_name || "",
        last_name: order.billing_address.last_name || "",
        company: order.billing_address.company || "",
        address_1: order.billing_address.address_1 || "",
        address_2: order.billing_address.address_2 || "",
        city: order.billing_address.city || "",
        postal_code: order.billing_address.postal_code || "",
        province: order.billing_address.province || "",
        country_code: order.billing_address.country_code || countryCode,
        phone: order.billing_address.phone || "",
      })
    } else if (order && !hasShippingAddress) {
      setBillingAddress((prev) => ({
        ...prev,
        company: companyName,
      }))
    }
    
    if (order?.shipping_methods?.[0]?.shipping_option_id) {
      setSelectedShippingOption(order.shipping_methods[0].shipping_option_id)
    }
    if (order?.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id) {
      setSelectedPaymentMethod(order.payment_collections[0].payment_sessions[0].provider_id)
    }
  }, [order, countryCode, employee, hasShippingAddress, hasCompanyAddresses])

  // Auto-select first shipping option
  useEffect(() => {
    if (!selectedShippingOption && shippingOptions.length > 0) {
      setSelectedShippingOption(shippingOptions[0].id)
    }
  }, [shippingOptions, selectedShippingOption])

  // Auto-select first saved payment method or first available
  useEffect(() => {
    if (hasSavedPaymentMethods && !selectedSavedPaymentId) {
      setSelectedSavedPaymentId(savedPaymentMethods[0].data.id)
      const stripeProvider = availablePaymentMethods.find((m) => m.id.includes("stripe"))
      if (stripeProvider) {
        setSelectedPaymentMethod(stripeProvider.id)
      }
    } else if (!hasSavedPaymentMethods && !selectedPaymentMethod && availablePaymentMethods.length > 0) {
      setSelectedPaymentMethod(availablePaymentMethods[0].id)
    }
  }, [availablePaymentMethods, savedPaymentMethods, hasSavedPaymentMethods, selectedPaymentMethod, selectedSavedPaymentId])

  const isLoading = authLoading || orderLoading

  const paymentStatus = order?.payment_collections?.[0]?.status as string | undefined
  const isPaid = paymentStatus === "captured" || paymentStatus === "authorized"

  // Step handlers
  const handleAddressSubmit = async () => {
    try {
      const billingData = sameAsBilling ? shippingAddress : billingAddress
      
      const { country_code: _shippingCountry, ...shippingWithoutCountry } = shippingAddress
      const shippingPayload = order?.shipping_address?.country_code 
        ? shippingWithoutCountry 
        : shippingAddress
      
      const { country_code: _billingCountry, ...billingWithoutCountry } = billingData
      const billingPayload = (order?.billing_address?.country_code || (sameAsBilling && order?.shipping_address?.country_code))
        ? billingWithoutCountry 
        : billingData
      
      await updateAddressMutation.mutateAsync({
        orderId,
        shipping_address: shippingPayload,
        billing_address: billingPayload,
      })
      await refetchOrder()
      setCurrentStep("shipping")
    } catch (error: any) {
      toast.error(error?.message || "Failed to update address")
    }
  }

  const handleShippingSubmit = async () => {
    if (!selectedShippingOption) {
      toast.error("Please select a shipping method")
      return
    }
    try {
      await setShippingMethodMutation.mutateAsync({
        orderId,
        shipping_option_id: selectedShippingOption,
      })
      await refetchOrder()
      setCurrentStep("payment")
    } catch (error: any) {
      toast.error(error?.message || "Failed to set shipping method")
    }
  }

  const handlePaymentSubmit = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method")
      return
    }
    try {
      await initPaymentSessionMutation.mutateAsync({
        orderId,
        provider_id: selectedPaymentMethod,
      })
      await refetchOrder()
      setCurrentStep("review")
    } catch (error: any) {
      toast.error(error?.message || "Failed to initialize payment")
    }
  }

  const handlePayment = async () => {
    try {
      await payOrderMutation.mutateAsync(orderId)
      toast.success("Payment successful! Your order is now being processed.")
      navigate({ to: `/${countryCode}/orders` })
    } catch (error: any) {
      toast.error(error?.message || "Payment failed. Please try again.")
    }
  }

  const handleSavedPaymentSelect = (method: SavedPaymentMethod) => {
    setSelectedSavedPaymentId(method.data.id)
    const stripeProvider = availablePaymentMethods.find((m) => m.id.includes("stripe"))
    if (stripeProvider) {
      setSelectedPaymentMethod(stripeProvider.id)
    }
  }

  const steps = useMemo(() => [
    { key: "address" as const, title: "Address", completed: hasShippingAddress },
    { key: "shipping" as const, title: "Shipping", completed: hasShippingMethod },
    { key: "payment" as const, title: "Payment", completed: hasPaymentSession },
    { key: "review" as const, title: "Review", completed: false },
  ], [hasShippingAddress, hasShippingMethod, hasPaymentSession])

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep)

  const isAddressStepValid = hasCompanyAddresses
    ? !!selectedShippingAddressId && (sameAsBilling || !!selectedBillingAddressId)
    : isShippingAddressValid && (sameAsBilling || isBillingAddressValid)

  const isPaymentStepValid = hasSavedPaymentMethods
    ? !!selectedSavedPaymentId && !!selectedPaymentMethod
    : !!selectedPaymentMethod

  // Loading and auth states
  if (!isAuthenticated && !authLoading) {
    return (
      <DashboardPageLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Complete Order</h1>
          <p className="text-gray-500 mt-1">Complete the checkout for your order.</p>
        </div>
        <div className="text-center py-12">
          <CurrencyDollar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Please log in to complete your order
          </h3>
          <p className="text-gray-500 mb-6">
            You need to be logged in to complete the checkout.
          </p>
          <Link
            to={"/$countryCode/account/login" as string} params={{ countryCode }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </DashboardPageLayout>
    )
  }

  if (isLoading) {
    return (
      <DashboardPageLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Complete Order</h1>
          <p className="text-gray-500 mt-1">Complete the checkout for your order.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <ArrowPath className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardPageLayout>
    )
  }

  if (!order) {
    return (
      <DashboardPageLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Complete Order</h1>
          <p className="text-gray-500 mt-1">Complete the checkout for your order.</p>
        </div>
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
          <p className="text-gray-500 mb-6">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            to={"/$countryCode/orders" as string} params={{ countryCode }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </DashboardPageLayout>
    )
  }

  if (isPaid) {
    return (
      <DashboardPageLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Complete Order</h1>
          <p className="text-gray-500 mt-1">Complete the checkout for your order.</p>
        </div>
        <div className="text-center py-12">
          <CheckCircleSolid className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Already Paid</h3>
          <p className="text-gray-500 mb-6">
            This order has already been paid. Thank you for your purchase!
          </p>
          <Link
            to={"/$countryCode/orders" as string} params={{ countryCode }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout>
      <div className="mb-6">
        <Link
          to={"/$countryCode/orders" as string} params={{ countryCode }}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Complete Order</h1>
        <p className="text-gray-500 mt-1">
          Complete the checkout for order {formatOrderId(String(order.display_id ?? order.id ?? ""))}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => {
                  if (step.completed || index <= currentStepIndex) {
                    setCurrentStep(step.key)
                  }
                }}
                disabled={!step.completed && index > currentStepIndex}
                className={`flex items-center gap-2 ${
                  index <= currentStepIndex || step.completed
                    ? "text-blue-600 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : index === currentStepIndex
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.completed ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className="hidden sm:inline font-medium">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-24 h-0.5 mx-2 ${
                    step.completed ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address Step */}
          {currentStep === "address" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Shipping Address
              </h2>

              {hasCompanyAddresses ? (
                <CompanyAddressSelector
                  addresses={companyAddresses}
                  selectedId={selectedShippingAddressId}
                  onSelect={handleSelectShippingAddress}
                />
              ) : (
                <AddressForm
                  addressFormData={shippingAddress}
                  setAddressFormData={setShippingAddress}
                  countries={undefined}
                  setIsFormValid={setIsShippingAddressValid}
                  lockedCountryCode={order.shipping_address?.country_code || undefined}
                />
              )}

              <div className="mt-6 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="same-as-billing"
                  checked={sameAsBilling}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setSameAsBilling(checked)
                    if (checked && hasCompanyAddresses && selectedShippingAddressId) {
                      setSelectedBillingAddressId(selectedShippingAddressId)
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <label htmlFor="same-as-billing" className="text-sm text-gray-700">
                  Billing address same as shipping
                </label>
              </div>

              {!sameAsBilling && (
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">
                    Billing Address
                  </h3>
                  {hasCompanyAddresses ? (
                    <CompanyAddressSelector
                      addresses={companyAddresses}
                      selectedId={selectedBillingAddressId}
                      onSelect={handleSelectBillingAddress}
                    />
                  ) : (
                    <AddressForm
                      addressFormData={billingAddress}
                      setAddressFormData={setBillingAddress}
                      countries={undefined}
                      setIsFormValid={setIsBillingAddressValid}
                      lockedCountryCode={order.billing_address?.country_code || undefined}
                    />
                  )}
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleAddressSubmit}
                  disabled={!isAddressStepValid || updateAddressMutation.isPending}
                >
                  {updateAddressMutation.isPending ? "Saving..." : "Continue to Shipping"}
                </Button>
              </div>
            </div>
          )}

          {/* Shipping Step */}
          {currentStep === "shipping" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Shipping Method
              </h2>

              {shippingOptions.length === 0 ? (
                <p className="text-gray-500">No shipping options available for this order.</p>
              ) : (
                <div className="space-y-3">
                  {shippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedShippingOption === option.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping-option"
                          value={option.id}
                          checked={selectedShippingOption === option.id}
                          onChange={() => setSelectedShippingOption(option.id)}
                          className="text-blue-600"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{option.name}</p>
                          <p className="text-sm text-gray-500">
                            {option.price_type === "flat" ? "Flat rate" : "Calculated"}
                          </p>
                        </div>
                      </div>
                      {option.amount !== undefined && (
                        <Price
                          price={option.amount}
                          currencyCode={order.currency_code}
                          className="font-medium"
                        />
                      )}
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <Button variant="secondary" onClick={() => setCurrentStep("address")}>
                  Back
                </Button>
                <Button
                  onClick={handleShippingSubmit}
                  disabled={!selectedShippingOption || setShippingMethodMutation.isPending}
                >
                  {setShippingMethodMutation.isPending ? "Saving..." : "Continue to Payment"}
                </Button>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === "payment" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Method
              </h2>

              {hasSavedPaymentMethods && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Select a company payment method</p>
                  {savedPaymentMethods.map((method) => {
                    const card = method.data?.card
                    const isSelected = selectedSavedPaymentId === method.data.id
                    return (
                      <button
                        key={method.data.id ?? method.id}
                        type="button"
                        onClick={() => handleSavedPaymentSelect(method)}
                        className={`w-full flex items-center gap-4 p-4 border rounded-lg transition-colors text-left ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="w-10 h-7 bg-gray-100 rounded flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {card ? cardBrandLabel(card.brand) : "Card"} ending in {card?.last4 || "****"}
                          </p>
                          {card && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Expires {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                            </p>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "border-zinc-900" : "border-gray-300"
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {!hasSavedPaymentMethods && (
                <>
                  {availablePaymentMethods.length === 0 ? (
                    <p className="text-gray-500">No payment methods available.</p>
                  ) : (
                    <div className="space-y-3">
                      {availablePaymentMethods.map((method) => (
                        <PaymentContainer
                          key={method.id}
                          paymentProviderId={method.id}
                          selectedPaymentOptionId={selectedPaymentMethod}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 flex gap-4">
                <Button variant="secondary" onClick={() => setCurrentStep("shipping")}>
                  Back
                </Button>
                <Button
                  onClick={handlePaymentSubmit}
                  disabled={!isPaymentStepValid || initPaymentSessionMutation.isPending}
                >
                  {initPaymentSessionMutation.isPending ? "Processing..." : "Continue to Review"}
                </Button>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === "review" && (
            <div className="space-y-6">
              {/* Addresses Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
                  <button
                    onClick={() => setCurrentStep("address")}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {order.shipping_address && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Shipping</p>
                      <Address address={order.shipping_address} />
                    </div>
                  )}
                  {order.billing_address && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Billing</p>
                      <Address address={order.billing_address} />
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Method Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Shipping Method</h2>
                  <button
                    onClick={() => setCurrentStep("shipping")}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-gray-700">
                  {order.shipping_methods?.[0]?.name || "Standard Shipping"}
                </p>
              </div>

              {/* Payment Method Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                  <button
                    onClick={() => setCurrentStep("payment")}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
                {selectedSavedPaymentId ? (
                  (() => {
                    const saved = savedPaymentMethods.find((m) => m.data.id === selectedSavedPaymentId)
                    const card = saved?.data?.card
                    return card ? (
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">
                          {cardBrandLabel(card.brand)} ending in {card.last4}
                        </span>
                      </div>
                    ) : (
                      <p className="text-gray-700">Saved payment method</p>
                    )
                  })()
                ) : (
                  <p className="text-gray-700">
                    {selectedPaymentMethod?.includes("stripe")
                      ? "Credit Card (Stripe)"
                      : "Manual Payment"}
                  </p>
                )}
              </div>

              {/* Payment Button */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    By clicking "Complete Payment", you agree to pay the total amount for this order.
                    For B2B orders, payment may be processed on account.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button variant="secondary" onClick={() => setCurrentStep("payment")}>
                    Back
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={payOrderMutation.isPending}
                    className="flex-1"
                  >
                    {payOrderMutation.isPending ? (
                      <>
                        <ArrowPath className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CurrencyDollar className="w-5 h-5 mr-2" />
                        Complete Payment - <Price price={order.total} currencyCode={order.currency_code} />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              <p className="text-sm text-gray-500 mt-1">
                {formatOrderId(String(order.display_id ?? order.id ?? ""))}
              </p>
            </div>

            {/* Items */}
            <div className="p-6 space-y-4 max-h-64 overflow-y-auto">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Thumbnail
                    thumbnail={item.thumbnail}
                    alt={item.product_title || item.title}
                    className="w-12 h-12"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {item.product_title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <Price
                    price={item.total}
                    currencyCode={order.currency_code}
                    className="text-sm font-medium"
                  />
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="p-6 bg-gray-50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <Price price={order.item_subtotal} currencyCode={order.currency_code} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <Price price={order.shipping_total} currencyCode={order.currency_code} />
              </div>
              {order.discount_total !== undefined && order.discount_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <Price
                    price={order.discount_total}
                    currencyCode={order.currency_code}
                    type="discount"
                  />
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <Price price={order.tax_total} currencyCode={order.currency_code} />
              </div>
              <hr className="border-gray-200 my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <Price price={order.total} currencyCode={order.currency_code} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  )
}
