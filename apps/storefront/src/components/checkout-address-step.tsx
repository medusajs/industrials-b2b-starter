import AddressForm from "@/components/address-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useSetCartAddresses } from "@/lib/hooks/use-checkout"
import { useAuth } from "@/lib/hooks/use-auth"
import { sdk } from "@/lib/utils/sdk"
import { getStoredCountryCode } from "@/lib/utils/region"
import { AddressFormData } from "@/lib/types/global"
import { HttpTypes } from "@medusajs/types"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { MapPin } from "@medusajs/icons"

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

interface AddressStepProps {
  cart: HttpTypes.StoreCart;
  onNext: () => void;
}

const AddressStep = ({ cart, onNext }: AddressStepProps) => {
  const setAddressesMutation = useSetCartAddresses()
  const { employee } = useAuth()
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isShippingAddressValid, setIsShippingAddressValid] = useState(false)
  const [isBillingAddressValid, setIsBillingAddressValid] = useState(false)
  const [email, setEmail] = useState(cart.email || "")
  const storedCountryCode = getStoredCountryCode()

  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string | null>(null)
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null)

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

  const shippingAddresses = companyAddresses.filter((a) => !a.is_billing_only)
  const billingAddresses = companyAddresses
  const hasCompanyAddresses = shippingAddresses.length > 0 && !!employee
  const hasCompanyBillingAddresses = billingAddresses.length > 0 && !!employee

  const [shippingAddress, setShippingAddress] = useState<AddressFormData>({
    first_name: cart.shipping_address?.first_name || "",
    last_name: cart.shipping_address?.last_name || "",
    company: cart.shipping_address?.company || "",
    address_1: cart.shipping_address?.address_1 || "",
    address_2: cart.shipping_address?.address_2 || "",
    city: cart.shipping_address?.city || "",
    postal_code: cart.shipping_address?.postal_code || "",
    province: cart.shipping_address?.province || "",
    country_code:
      cart.shipping_address?.country_code || storedCountryCode || "",
    phone: cart.shipping_address?.phone || "",
  })
  const [billingAddress, setBillingAddress] = useState<AddressFormData>({
    first_name: cart.billing_address?.first_name || "",
    last_name: cart.billing_address?.last_name || "",
    company: cart.billing_address?.company || "",
    address_1: cart.billing_address?.address_1 || "",
    address_2: cart.billing_address?.address_2 || "",
    city: cart.billing_address?.city || "",
    postal_code: cart.billing_address?.postal_code || "",
    province: cart.billing_address?.province || "",
    country_code: cart.billing_address?.country_code || storedCountryCode || "",
    phone: cart.billing_address?.phone || "",
  })

  useEffect(() => {
    if (hasCompanyAddresses && !selectedShippingAddressId) {
      const defaultShipping = shippingAddresses.find((a) => a.is_default_shipping) || shippingAddresses[0]
      setSelectedShippingAddressId(defaultShipping.id)
      applyCompanyAddress(defaultShipping, setShippingAddress)
      setIsShippingAddressValid(true)
      if (sameAsBilling) {
        setSelectedBillingAddressId(defaultShipping.id)
      }
    }
    if (hasCompanyBillingAddresses && !selectedBillingAddressId && !sameAsBilling) {
      const defaultBilling = billingAddresses.find((a) => a.is_default_billing) || billingAddresses[0]
      setSelectedBillingAddressId(defaultBilling.id)
      applyCompanyAddress(defaultBilling, setBillingAddress)
      setIsBillingAddressValid(true)
    }
  }, [hasCompanyAddresses, shippingAddresses, hasCompanyBillingAddresses, billingAddresses, sameAsBilling])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const submitData = new FormData()

      submitData.append("email", email)

      Object.entries(shippingAddress).forEach(([key, value]) => {
        submitData.append(`shipping_address.${key}`, value)
      })

      const billingData = sameAsBilling ? shippingAddress : billingAddress
      Object.entries(billingData).forEach(([key, value]) => {
        submitData.append(`billing_address.${key}`, value)
      })

      await setAddressesMutation.mutateAsync(submitData)
      onNext()
    } catch {
      // Error is handled by mutation state
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    const emailValid = email.trim() && email.includes("@")

    if (hasCompanyAddresses) {
      const shippingValid = !!selectedShippingAddressId
      const billingValid = sameAsBilling || !!selectedBillingAddressId
      return emailValid && shippingValid && billingValid
    }

    return (
      emailValid &&
      isShippingAddressValid &&
      (isBillingAddressValid || sameAsBilling)
    )
  }

  useEffect(() => {
    if (!cart.region) {
      return
    }

    const isValidShippingAddressCountry = cart.region.countries?.some(
      (country) => country.iso_2 === shippingAddress.country_code
    )
    if (!isValidShippingAddressCountry && !hasCompanyAddresses) {
      setShippingAddress((prev) => ({
        ...prev,
        country_code: storedCountryCode || "",
      }))
    }

    const isValidBillingAddressCountry = cart.region.countries?.some(
      (country) => country.iso_2 === billingAddress.country_code
    )
    if (!isValidBillingAddressCountry && !hasCompanyAddresses) {
      setBillingAddress((prev) => ({
        ...prev,
        country_code: storedCountryCode || "",
      }))
    }
  }, [cart.region, storedCountryCode, shippingAddress.country_code, billingAddress.country_code, hasCompanyAddresses])

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Shipping Address */}
        <div className="flex flex-col gap-2">
          <h3 className="text-zinc-900 !text-base font-semibold">
            Shipping Address
          </h3>
          {hasCompanyAddresses ? (
            <CompanyAddressSelector
              addresses={shippingAddresses}
              selectedId={selectedShippingAddressId}
              onSelect={handleSelectShippingAddress}
            />
          ) : (
            <AddressForm
              addressFormData={shippingAddress}
              setAddressFormData={setShippingAddress}
              countries={cart.region?.countries}
              setIsFormValid={setIsShippingAddressValid}
            />
          )}
        </div>

        {/* Billing Address Checkbox */}
        <div className="flex items-center gap-x-2">
          <Checkbox
            id="same_as_billing"
            type="checkbox"
            checked={sameAsBilling}
            onChange={(e) => {
              const checked = !!e.target.checked
              setSameAsBilling(checked)
              if (checked && hasCompanyAddresses && selectedShippingAddressId) {
                setSelectedBillingAddressId(selectedShippingAddressId)
              }
            }}
          />
          <label htmlFor="same_as_billing" className="text-sm">
            Billing address is the same as shipping address
          </label>
        </div>

        {/* Billing Address (if different) */}
        {!sameAsBilling && (
          <div className="flex flex-col gap-2">
            <h3 className="text-zinc-900 !text-base font-semibold">
              Billing Address
            </h3>
            {hasCompanyBillingAddresses ? (
              <CompanyAddressSelector
                addresses={billingAddresses}
                selectedId={selectedBillingAddressId}
                onSelect={handleSelectBillingAddress}
              />
            ) : (
              <AddressForm
                addressFormData={billingAddress}
                setAddressFormData={setBillingAddress}
                countries={cart.region?.countries}
                setIsFormValid={setIsBillingAddressValid}
              />
            )}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full"
          />
          <p className="text-xs text-zinc-600">
            You'll receive order updates to this email.
          </p>
        </div>

        <div className="flex">
          <Button type="submit" disabled={!isFormValid() || isSubmitting}>
            Next
          </Button>
        </div>
      </form>
    </div>
  )
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
      <p className="text-sm text-zinc-600">Select a company address</p>
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
                : "border-zinc-200 hover:border-zinc-300"
            }`}
          >
            <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900">{addr.name}</p>
              <p className="text-sm text-zinc-600 mt-0.5">
                {addr.first_name} {addr.last_name}
                {addr.company_name ? ` - ${addr.company_name}` : ""}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {addr.address_1}
                {addr.address_2 ? `, ${addr.address_2}` : ""}
                , {addr.city}
                {addr.province ? `, ${addr.province}` : ""}
                {" "}{addr.postal_code}, {addr.country_code.toUpperCase()}
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              isSelected ? "border-zinc-900" : "border-zinc-300"
            }`}>
              {isSelected && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default AddressStep
