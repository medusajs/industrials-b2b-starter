import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearch } from "@tanstack/react-router"
import { useAuth } from "@/lib/hooks/use-auth"
import { sdk } from "@/lib/utils/sdk"
import { toast } from "sonner"
import { DashboardPageLayout } from "@/components/dashboard-page-layout"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Camera, Buildings, Plus, XMark, CreditCard, MapPin, PencilSquare } from "@medusajs/icons"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

interface ProfileFormData {
  first_name: string
  last_name: string
  phone: string
}

interface CompanyFormData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  country_code: string
  logo_url: string | null
}

type SpendLimitResetFrequency = "none" | "daily" | "weekly" | "monthly" | "yearly"

interface Company {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country_code: string | null
  logo_url: string | null
  status: string
  spend_limit_reset_frequency: SpendLimitResetFrequency
}

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
  is_default_shipping: boolean
  is_default_billing: boolean
  is_billing_only: boolean
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

const RESET_FREQUENCY_OPTIONS: { value: SpendLimitResetFrequency; label: string; description: string }[] = [
  { value: "none", label: "Never", description: "Spending limits never reset" },
  { value: "daily", label: "Daily", description: "Resets every day at midnight" },
  { value: "weekly", label: "Weekly", description: "Resets every Monday" },
  { value: "monthly", label: "Monthly", description: "Resets on the 1st of each month" },
  { value: "yearly", label: "Yearly", description: "Resets on January 1st" },
]

function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="h-4 w-56 bg-slate-200 rounded mt-2" />
        </div>
        <div className="h-9 w-14 bg-slate-200 rounded" />
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className={i === 0 || i === rows - 1 ? "md:col-span-2" : ""}>
              <div className="h-4 w-24 bg-slate-200 rounded mb-1.5" />
              <div className="h-6 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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

function AddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      })

      if (error) {
        toast.error(error.message || "Failed to save card")
      } else {
        toast.success("Card saved successfully")
        onSuccess()
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save card")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !stripe || !elements}
          className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Card"}
        </button>
      </div>
    </form>
  )
}

function PaymentMethodsSection({ companyData }: { companyData: Company }) {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: paymentMethods, isLoading: isLoadingMethods, refetch: refetchMethods } = useQuery({
    queryKey: ["company-payment-methods"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ payment_methods: SavedPaymentMethod[] }>(
        "/store/company/payment-methods",
        { method: "GET" }
      )
      return response.payment_methods
    },
    enabled: companyData.status === "active",
  })

  const createSetupIntentMutation = useMutation({
    mutationFn: async () => {
      const response = await sdk.client.fetch<{ client_secret: string }>(
        "/store/company/payment-methods",
        { method: "POST" }
      )
      return response.client_secret
    },
    onSuccess: (clientSecret) => {
      setSetupClientSecret(clientSecret)
      setIsModalOpen(true)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to initialize card setup")
    },
  })

  const deleteMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      await sdk.client.fetch(`/store/company/payment-methods/${paymentMethodId}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      toast.success("Payment method removed")
      refetchMethods()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove payment method")
    },
    onSettled: () => {
      setDeletingId(null)
    },
  })

  const handleAddCardSuccess = () => {
    setIsModalOpen(false)
    setSetupClientSecret(null)
    refetchMethods()
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSetupClientSecret(null)
  }

  const hasPaymentMethods = !!paymentMethods?.length

  if (companyData.status !== "active") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Payment Methods</h2>
          <p className="text-sm text-slate-500">Manage saved payment methods for your company</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Payment methods are available once your company is activated.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payment Methods</h2>
            <p className="text-sm text-slate-500">Manage saved payment methods for your company</p>
          </div>
          {hasPaymentMethods && (
            <button
              onClick={() => createSetupIntentMutation.mutate()}
              disabled={createSetupIntentMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {createSetupIntentMutation.isPending ? "Setting up..." : "Add Card"}
            </button>
          )}
        </div>

        <div className="p-6">
          {isLoadingMethods ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg animate-pulse">
                  <div className="w-10 h-7 bg-slate-200 rounded" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-100 rounded mt-1.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : !hasPaymentMethods ? (
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">No payment methods saved yet.</p>
              <button
                onClick={() => createSetupIntentMutation.mutate()}
                disabled={createSetupIntentMutation.isPending}
                className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {createSetupIntentMutation.isPending ? "Setting up..." : "Add Your First Card"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const card = method.data?.card
                const isDeleting = deletingId === method.data?.id
                return (
                  <div
                    key={method.data?.id ?? method.id}
                    className={`flex items-center gap-4 p-4 border border-slate-200 rounded-lg transition-opacity ${
                      isDeleting ? "opacity-50" : ""
                    }`}
                  >
                    <div className="w-10 h-7 bg-slate-100 rounded flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {card ? cardBrandLabel(card.brand) : "Card"} ending in {card?.last4 || "****"}
                      </p>
                      {card && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Expires {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setDeletingId(method.data?.id as string)
                        deleteMethodMutation.mutate(method.data?.id as string)
                      }}
                      disabled={isDeleting}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed"
                      title="Remove payment method"
                    >
                      <XMark className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) handleModalClose() }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Add Payment Method</DialogTitle>
            <DialogDescription>
              Enter your card details below. Your card will be securely saved for future purchases.
            </DialogDescription>
          </DialogHeader>
          {setupClientSecret && stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: setupClientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    borderRadius: "8px",
                  },
                },
              }}
            >
              <AddCardForm onSuccess={handleAddCardSuccess} onCancel={handleModalClose} />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function AddressesSection({ companyData }: { companyData: Company }) {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CompanyAddressData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const emptyForm = {
    name: "",
    first_name: "",
    last_name: "",
    company_name: "",
    address_1: "",
    address_2: "",
    city: "",
    province: "",
    postal_code: "",
    country_code: "us",
    phone: "",
    is_default_shipping: false,
    is_default_billing: false,
    is_billing_only: false,
  }
  const [formData, setFormData] = useState(emptyForm)

  const { data: addresses, isLoading, refetch: refetchAddresses } = useQuery({
    queryKey: ["company-addresses"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ addresses: CompanyAddressData[] }>(
        "/store/company/addresses",
        { method: "GET" }
      )
      return response.addresses
    },
    enabled: companyData.status === "active",
  })

  const createAddressMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const response = await sdk.client.fetch<{ address: CompanyAddressData }>(
        "/store/company/addresses",
        {
          method: "POST",
          body: {
            name: data.name,
            first_name: data.first_name,
            last_name: data.last_name,
            company_name: data.company_name || null,
            address_1: data.address_1,
            address_2: data.address_2 || null,
            city: data.city,
            province: data.province || null,
            postal_code: data.postal_code,
            country_code: data.country_code,
            phone: data.phone || null,
            is_default_shipping: data.is_default_shipping,
            is_default_billing: data.is_default_billing,
            is_billing_only: data.is_billing_only,
          },
        }
      )
      return response.address
    },
    onSuccess: () => {
      toast.success("Address added")
      handleModalClose()
      refetchAddresses()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add address")
    },
  })

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emptyForm }) => {
      const response = await sdk.client.fetch<{ address: CompanyAddressData }>(
        `/store/company/addresses/${id}`,
        {
          method: "POST",
          body: {
            name: data.name,
            first_name: data.first_name,
            last_name: data.last_name,
            company_name: data.company_name || null,
            address_1: data.address_1,
            address_2: data.address_2 || null,
            city: data.city,
            province: data.province || null,
            postal_code: data.postal_code,
            country_code: data.country_code,
            phone: data.phone || null,
            is_default_shipping: data.is_default_shipping,
            is_default_billing: data.is_default_billing,
            is_billing_only: data.is_billing_only,
          },
        }
      )
      return response.address
    },
    onSuccess: () => {
      toast.success("Address updated")
      handleModalClose()
      refetchAddresses()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update address")
    },
  })

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      await sdk.client.fetch(`/store/company/addresses/${addressId}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      toast.success("Address removed")
      refetchAddresses()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove address")
    },
    onSettled: () => {
      setDeletingId(null)
    },
  })

  const handleOpenAdd = () => {
    setEditingAddress(null)
    setFormData(emptyForm)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (address: CompanyAddressData) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      first_name: address.first_name,
      last_name: address.last_name,
      company_name: address.company_name || "",
      address_1: address.address_1,
      address_2: address.address_2 || "",
      city: address.city,
      province: address.province || "",
      postal_code: address.postal_code,
      country_code: address.country_code,
      phone: address.phone || "",
      is_default_shipping: address.is_default_shipping,
      is_default_billing: address.is_default_billing,
      is_billing_only: address.is_billing_only,
    })
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingAddress(null)
    setFormData(emptyForm)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: formData })
    } else {
      createAddressMutation.mutate(formData)
    }
  }

  const isSubmitting = createAddressMutation.isPending || updateAddressMutation.isPending

  const isFormValid =
    formData.name.trim() &&
    formData.first_name.trim() &&
    formData.last_name.trim() &&
    formData.address_1.trim() &&
    formData.city.trim() &&
    formData.postal_code.trim() &&
    formData.country_code.trim()

  const hasAddresses = !!addresses?.length

  if (companyData.status !== "active") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Shipping Addresses</h2>
          <p className="text-sm text-slate-500">Manage approved shipping and billing addresses for your company</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Addresses are available once your company is activated.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Shipping Addresses</h2>
            <p className="text-sm text-slate-500">Manage approved shipping and billing addresses for your company</p>
          </div>
          {hasAddresses && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Address
            </button>
          )}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded" />
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-slate-200 rounded" />
                    <div className="h-3 w-56 bg-slate-100 rounded mt-1.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : !hasAddresses ? (
            <div className="text-center py-8">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">No addresses added yet.</p>
              <button
                onClick={handleOpenAdd}
                className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => {
                const isDeleting = deletingId === address.id
                const countryName = address.country_code?.toUpperCase()
                return (
                  <div
                    key={address.id}
                    className={`flex items-start gap-4 p-4 border border-slate-200 rounded-lg transition-opacity ${
                      isDeleting ? "opacity-50" : ""
                    }`}
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-900">{address.name}</p>
                        {address.is_default_shipping && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Default Shipping
                          </span>
                        )}
                        {address.is_default_billing && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Default Billing
                          </span>
                        )}
                        {address.is_billing_only && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Billing Only
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {address.first_name} {address.last_name}
                        {address.company_name ? ` - ${address.company_name}` : ""}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {address.address_1}
                        {address.address_2 ? `, ${address.address_2}` : ""}
                      </p>
                      <p className="text-sm text-slate-500">
                        {address.city}
                        {address.province ? `, ${address.province}` : ""}
                        {" "}{address.postal_code}, {countryName}
                      </p>
                      {address.phone && (
                        <p className="text-xs text-slate-400 mt-1">{address.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEdit(address)}
                        disabled={isDeleting}
                        className="p-2 text-slate-400 hover:text-accent transition-colors disabled:cursor-not-allowed"
                        title="Edit address"
                      >
                        <PencilSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingId(address.id)
                          deleteAddressMutation.mutate(address.id)
                        }}
                        disabled={isDeleting}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed"
                        title="Remove address"
                      >
                        <XMark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) handleModalClose() }}>
        <DialogContent className="bg-white max-w-lg max-h-[90vh] !flex !flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-slate-900">
              {editingAddress ? "Edit Address" : "Add Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update the address details below."
                : "Enter the address details below. This address will be available for employees during checkout."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 mt-2">
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 px-1 -mx-1 scrollbar-hide">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address Label</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                placeholder="e.g., Main Office, Warehouse"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                placeholder="Company name (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address Line 1</label>
              <input
                type="text"
                value={formData.address_1}
                onChange={(e) => setFormData({ ...formData, address_1: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address Line 2</label>
              <input
                type="text"
                value={formData.address_2}
                onChange={(e) => setFormData({ ...formData, address_2: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                placeholder="Apt, suite, floor (optional)"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">State / Province</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Postal Code</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="Postal code"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
                <select
                  value={formData.country_code}
                  onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white"
                >
                  <option value="">Select country</option>
                  <option value="us">United States</option>
                  <option value="ca">Canada</option>
                  <option value="gb">United Kingdom</option>
                  <option value="de">Germany</option>
                  <option value="fr">France</option>
                  <option value="it">Italy</option>
                  <option value="es">Spain</option>
                  <option value="au">Australia</option>
                  <option value="nl">Netherlands</option>
                  <option value="se">Sweden</option>
                  <option value="dk">Denmark</option>
                  <option value="no">Norway</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="Phone (optional)"
                />
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <p className="text-sm font-medium text-slate-700">Address Options</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default_shipping}
                  onChange={(e) => setFormData({ ...formData, is_default_shipping: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/20"
                />
                <div>
                  <span className="text-sm text-slate-900">Default shipping address</span>
                  <p className="text-xs text-slate-500">Use this as the default address for shipping</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default_billing}
                  onChange={(e) => setFormData({ ...formData, is_default_billing: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/20"
                />
                <div>
                  <span className="text-sm text-slate-900">Default billing address</span>
                  <p className="text-xs text-slate-500">Use this as the default address for billing</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_billing_only}
                  onChange={(e) => setFormData({ ...formData, is_billing_only: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/20"
                />
                <div>
                  <span className="text-sm text-slate-900">Billing only</span>
                  <p className="text-xs text-slate-500">This address can only be used for billing, not shipping</p>
                </div>
              </label>
            </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 flex-shrink-0 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : editingAddress ? "Update Address" : "Add Address"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function SettingsPage() {
  const { customer, refetch, isLoading: isCustomerLoading, isAdmin, employee } = useAuth()
  const searchParams = useSearch({ strict: false }) as { tab?: string } | undefined
  const initialTab = (searchParams?.tab as "profile" | "company" | "addresses" | "payment_methods") || "profile"
  const [activeTab, setActiveTab] = useState<"profile" | "company" | "addresses" | "payment_methods">(initialTab)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingCompany, setIsEditingCompany] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    phone: "",
  })
  const [companyFormData, setCompanyFormData] = useState<CompanyFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country_code: "",
    logo_url: null,
  })
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const { data: companyData, isLoading: isCompanyLoading, refetch: refetchCompany } = useQuery({
    queryKey: ["company", employee?.company_id],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ company: Company }>("/store/company", {
        method: "GET",
      })
      return response.company
    },
    enabled: isAdmin && !!employee?.company_id,
  })

  useEffect(() => {
    if (customer) {
      setProfileFormData({
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        phone: customer.phone || "",
      })
    }
  }, [customer])

  useEffect(() => {
    if (companyData) {
      setCompanyFormData({
        name: companyData.name || "",
        email: companyData.email || "",
        phone: companyData.phone || "",
        address: companyData.address || "",
        city: companyData.city || "",
        state: companyData.state || "",
        postal_code: companyData.postal_code || "",
        country_code: companyData.country_code || "",
        logo_url: companyData.logo_url || null,
      })
    }
  }, [companyData])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await sdk.store.customer.update({
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
        phone: data.phone || undefined,
      })
      return response.customer
    },
    onSuccess: () => {
      toast.success("Profile updated successfully")
      setIsEditingProfile(false)
      refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile")
    },
  })

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const response = await sdk.client.fetch<{ company: Company }>("/store/company/me", {
        method: "POST",
        body: {
          name: data.name || undefined,
          email: data.email || undefined,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          postal_code: data.postal_code || null,
          country_code: data.country_code || null,
          logo_url: data.logo_url || null,
        },
      })
      return response.company
    },
    onSuccess: () => {
      toast.success("Company updated successfully")
      setIsEditingCompany(false)
      refetchCompany()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update company")
    },
  })

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true)

      const presigned = await sdk.client.fetch<{
        url: string
        file_key: string
      }>("/store/uploads", {
        method: "POST",
        body: {
          filename: file.name,
          mime_type: file.type,
          access: "public",
        },
      })

      await fetch(presigned.url, {
        method: "PUT",
        body: file,
      })

      const fileUrl = presigned.url.split("?")[0]
      setCompanyFormData((prev) => ({ ...prev, logo_url: fileUrl }))

      if (!isEditingCompany) {
        setIsEditingCompany(true)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const updateResetFrequencyMutation = useMutation({
    mutationFn: async (frequency: SpendLimitResetFrequency) => {
      const response = await sdk.client.fetch<{ company: Company }>("/store/company/me", {
        method: "POST",
        body: {
          spend_limit_reset_frequency: frequency,
        },
      })
      return response.company
    },
    onSuccess: () => {
      toast.success("Spending limit reset frequency updated")
      refetchCompany()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update reset frequency")
    },
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB")
      return
    }

    handleLogoUpload(file)
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(profileFormData)
  }

  const handleProfileCancel = () => {
    setProfileFormData({
      first_name: customer?.first_name || "",
      last_name: customer?.last_name || "",
      phone: customer?.phone || "",
    })
    setIsEditingProfile(false)
  }

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateCompanyMutation.mutate(companyFormData)
  }

  const handleCompanyCancel = () => {
    if (companyData) {
      setCompanyFormData({
        name: companyData.name || "",
        email: companyData.email || "",
        phone: companyData.phone || "",
        address: companyData.address || "",
        city: companyData.city || "",
        state: companyData.state || "",
        postal_code: companyData.postal_code || "",
        country_code: companyData.country_code || "",
        logo_url: companyData.logo_url || null,
      })
    }
    setIsEditingCompany(false)
  }

  const tabs = [
    { id: "profile" as const, label: "Profile" },
    ...(isAdmin ? [
      { id: "company" as const, label: "Company" },
      { id: "addresses" as const, label: "Addresses" },
      ...(stripePublishableKey ? [{ id: "payment_methods" as const, label: "Payment Methods" }] : []),
    ] : []),
  ]

  return (
    <DashboardPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-8" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Tab Content */}
        {activeTab === "profile" && (
          isCustomerLoading || updateProfileMutation.isPending ? (
            <CardSkeleton rows={4} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
                  <p className="text-sm text-slate-500">Update your personal details</p>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={customer?.email || ""}
                      disabled
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                      First Name
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        id="first_name"
                        value={profileFormData.first_name}
                        onChange={(e) => setProfileFormData({ ...profileFormData, first_name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="Enter first name"
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {customer?.first_name || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Last Name
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        id="last_name"
                        value={profileFormData.last_name}
                        onChange={(e) => setProfileFormData({ ...profileFormData, last_name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="Enter last name"
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {customer?.last_name || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="tel"
                        id="phone"
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {customer?.phone || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleProfileCancel}
                      disabled={updateProfileMutation.isPending}
                      className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          )
        )}

        {/* Company Tab Content */}
        {activeTab === "company" && isAdmin && (
          isCompanyLoading || updateCompanyMutation.isPending ? (
            <CardSkeleton rows={8} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Company Information</h2>
                  <p className="text-sm text-slate-500">Update your company details</p>
                </div>
                {!isEditingCompany && (
                  <button
                    onClick={() => setIsEditingCompany(true)}
                    className="px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleCompanySubmit} className="p-6">
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Company Logo
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
                        {(companyFormData.logo_url || companyData?.logo_url) ? (
                          <img
                            src={companyFormData.logo_url || companyData?.logo_url || ""}
                            alt={companyData?.name || "Company logo"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Buildings className="w-10 h-10 text-slate-400" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="absolute -bottom-2 -right-2 p-2 bg-accent text-white rounded-full shadow-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </div>
                    <div className="text-sm text-slate-500">
                      <p className="font-medium text-slate-700">Upload a logo</p>
                      <p>JPG, PNG, GIF, WebP, or SVG. Max 5MB.</p>
                      {isUploadingLogo && (
                        <p className="text-accent mt-1">Uploading...</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="company_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Company Name
                    </label>
                    {isEditingCompany ? (
                      <input
                        type="text"
                        id="company_name"
                        value={companyFormData.name}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="Enter company name"
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {companyData?.name || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="company_email" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Company Email
                    </label>
                    {isEditingCompany ? (
                      <input
                        type="email"
                        id="company_email"
                        value={companyFormData.email}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="Enter company email"
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {companyData?.email || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="company_phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Company Phone
                    </label>
                    {isEditingCompany ? (
                      <input
                        type="tel"
                        id="company_phone"
                        value={companyFormData.phone}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="Enter company phone"
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {companyData?.phone || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Street Address
                    </label>
                    {isEditingCompany ? (
                      <input
                        type="text"
                        id="address"
                        value={companyFormData.address}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="Enter street address"
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {companyData?.address || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1.5">
                      City
                    </label>
                    {isEditingCompany ? (
                      <input
                        type="text"
                        id="city"
                        value={companyFormData.city}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, city: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="Enter city"
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {companyData?.city || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1.5">
                      State / Province
                    </label>
                    {isEditingCompany ? (
                      <input
                        type="text"
                        id="state"
                        value={companyFormData.state}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, state: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="Enter state"
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {companyData?.state || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Postal Code
                    </label>
                    {isEditingCompany ? (
                      <input
                        type="text"
                        id="postal_code"
                        value={companyFormData.postal_code}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, postal_code: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="Enter postal code"
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {companyData?.postal_code || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="country_code" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Country Code
                    </label>
                    {isEditingCompany ? (
                      <input
                        type="text"
                        id="country_code"
                        value={companyFormData.country_code}
                        onChange={(e) => setCompanyFormData({ ...companyFormData, country_code: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                        placeholder="e.g., US"
                        maxLength={2}
                      />
                    ) : (
                      <p className="px-4 py-2.5 text-slate-900">
                        {companyData?.country_code?.toUpperCase() || <span className="text-slate-400">Not set</span>}
                      </p>
                    )}
                  </div>
                </div>

                {isEditingCompany && (
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleCompanyCancel}
                      disabled={updateCompanyMutation.isPending}
                      className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateCompanyMutation.isPending}
                      className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          )
        )}

        {/* Spending Limit Reset Frequency Section */}
        {activeTab === "company" && isAdmin && !isCompanyLoading && companyData && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Spending Limit Settings</h2>
              <p className="text-sm text-slate-500">Configure how often employee spending limits reset</p>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {RESET_FREQUENCY_OPTIONS.map((option) => {
                  const isSelected = companyData.spend_limit_reset_frequency === option.value
                  const isPending = updateResetFrequencyMutation.isPending

                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-accent bg-accent/5"
                          : "border-slate-200 hover:border-slate-300"
                      } ${isPending ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <input
                        type="radio"
                        name="reset_frequency"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => updateResetFrequencyMutation.mutate(option.value)}
                        disabled={isPending}
                        className="mt-1 h-4 w-4 text-accent focus:ring-accent border-slate-300"
                      />
                      <div>
                        <span className="block text-sm font-medium text-slate-900">
                          {option.label}
                        </span>
                        <span className="block text-sm text-slate-500 mt-0.5">
                          {option.description}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>

              {updateResetFrequencyMutation.isPending && (
                <p className="text-sm text-slate-500 mt-4">Saving...</p>
              )}
            </div>
          </div>
        )}

        {/* Addresses Tab Content */}
        {activeTab === "addresses" && isAdmin && (
          isCompanyLoading ? (
            <CardSkeleton rows={3} />
          ) : companyData ? (
            <AddressesSection companyData={companyData} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm text-slate-500">Company data not available.</p>
            </div>
          )
        )}

        {/* Payment Methods Tab Content */}
        {activeTab === "payment_methods" && isAdmin && (
          isCompanyLoading ? (
            <CardSkeleton rows={3} />
          ) : companyData ? (
            <PaymentMethodsSection companyData={companyData} />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm text-slate-500">Company data not available.</p>
            </div>
          )
        )}
      </div>
    </DashboardPageLayout>
  )
}
