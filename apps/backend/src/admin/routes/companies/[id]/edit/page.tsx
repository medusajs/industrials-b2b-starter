import { useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, Controller, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Drawer,
  Heading,
  Label,
  Input,
  Button,
  Select,
  toast,
} from "@medusajs/ui"
import { sdk } from "../../../../lib/client"
import { ImageUpload } from "../../../../components/image-upload"
import { CompanySetupStatus } from "../../../../components/company-setup-status"

const editCompanySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  logo_url: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  status: z.enum(["pending", "active", "inactive", "suspended"]),
})

type EditCompanyFormValues = z.infer<typeof editCompanySchema>

type Company = {
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
  status: "pending" | "active" | "inactive" | "suspended"
}

type CompanyResponse = {
  company: Company
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
]

// Separate form component that only mounts when data is ready
const EditCompanyForm = ({ 
  company, 
  onSubmit, 
  onCancel,
  isPending 
}: { 
  company: Company
  onSubmit: (values: EditCompanyFormValues) => void
  onCancel: () => void
  isPending: boolean
}) => {
  const form = useForm<EditCompanyFormValues>({
    resolver: zodResolver(editCompanySchema),
    defaultValues: {
      name: company.name,
      email: company.email,
      phone: company.phone || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      postal_code: company.postal_code || "",
      country_code: company.country_code || "",
      logo_url: company.logo_url || "",
      status: company.status,
    },
  })

  // Fetch regions to get available countries
  const { data: regionsData } = useQuery({
    queryKey: ["regions"],
    queryFn: () => sdk.admin.region.list({ fields: "id,name,countries.*" }),
  })

  // Extract unique countries from all regions
  const countryOptions = useMemo(() => {
    if (!regionsData?.regions) return []
    
    const countriesMap = new Map<string, string>()
    regionsData.regions.forEach(region => {
      region.countries?.forEach(country => {
        if (country.iso_2 && country.display_name) {
          countriesMap.set(country.iso_2.toLowerCase(), country.display_name)
        }
      })
    })
    
    return Array.from(countriesMap.entries())
      .map(([code, name]) => ({ value: code, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [regionsData])

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <Drawer.Body className="flex max-w-full flex-1 flex-col gap-y-4 overflow-y-auto">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <div className="flex flex-col space-y-2">
                <Label size="small" weight="plus">
                  Name *
                </Label>
                <Input {...field} placeholder="Company name" />
                {fieldState.error && (
                  <span className="text-ui-fg-error text-small">
                    {fieldState.error.message}
                  </span>
                )}
              </div>
            )}
          />

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <div className="flex flex-col space-y-2">
                <Label size="small" weight="plus">
                  Email *
                </Label>
                <Input {...field} type="email" placeholder="company@example.com" />
                {fieldState.error && (
                  <span className="text-ui-fg-error text-small">
                    {fieldState.error.message}
                  </span>
                )}
              </div>
            )}
          />

          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <Label size="small" weight="plus">
                  Phone
                </Label>
                <Input {...field} value={field.value || ""} placeholder="+1 234 567 8900" />
              </div>
            )}
          />

          <Controller
            control={form.control}
            name="address"
            render={({ field }) => (
              <div className="flex flex-col space-y-2">
                <Label size="small" weight="plus">
                  Address
                </Label>
                <Input {...field} value={field.value || ""} placeholder="123 Main St" />
              </div>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="city"
              render={({ field }) => (
                <div className="flex flex-col space-y-2">
                  <Label size="small" weight="plus">
                    City
                  </Label>
                  <Input {...field} value={field.value || ""} placeholder="New York" />
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="state"
              render={({ field }) => (
                <div className="flex flex-col space-y-2">
                  <Label size="small" weight="plus">
                    State
                  </Label>
                  <Input {...field} value={field.value || ""} placeholder="NY" />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <div className="flex flex-col space-y-2">
                  <Label size="small" weight="plus">
                    Postal Code
                  </Label>
                  <Input {...field} value={field.value || ""} placeholder="10001" />
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="country_code"
              render={({ field }) => {
                const selectedCountry = countryOptions.find(c => c.value === field.value)
                return (
                  <div className="flex flex-col space-y-2">
                    <Label size="small" weight="plus">
                      Country
                    </Label>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder="Select country">
                          {selectedCountry?.label || "Select country"}
                        </Select.Value>
                      </Select.Trigger>
                      <Select.Content>
                        {countryOptions.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                )
              }}
            />
          </div>

          <Controller
            control={form.control}
            name="logo_url"
            render={({ field, fieldState }) => (
              <ImageUpload
                label="Logo"
                value={field.value}
                onChange={(url) => field.onChange(url || "")}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="status"
            render={({ field }) => {
              console.log("[EditCompanyForm] Status field render, value:", field.value)
              const selectedOption = statusOptions.find(o => o.value === field.value)
              return (
                <div className="flex flex-col space-y-2">
                  <Label size="small" weight="plus">
                    Status
                  </Label>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Select status">
                        {selectedOption?.label || "Select status"}
                      </Select.Value>
                    </Select.Trigger>
                    <Select.Content>
                      {statusOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
              )
            }}
          />

          <div className="border-t border-ui-border-base pt-4 mt-2">
            <CompanySetupStatus companyId={company.id} />
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <Button size="small" variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
            >
              Save
            </Button>
          </div>
        </Drawer.Footer>
      </form>
    </FormProvider>
  )
}

const EditCompanyPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<CompanyResponse>({
    queryKey: ["company", id],
    queryFn: () => sdk.client.fetch<CompanyResponse>(`/admin/companies/${id}`),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (values: EditCompanyFormValues) =>
      sdk.client.fetch(`/admin/companies/${id}`, {
        method: "POST",
        body: {
          ...values,
          phone: values.phone || null,
          address: values.address || null,
          city: values.city || null,
          state: values.state || null,
          postal_code: values.postal_code || null,
          country_code: values.country_code || null,
          logo_url: values.logo_url || null,
        },
      }),
    onSuccess: () => {
      toast.success("Company updated successfully")
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      queryClient.invalidateQueries({ queryKey: ["company", id] })
      navigate("/companies")
    },
    onError: () => {
      toast.error("Failed to update company")
    },
  })

  const handleClose = () => {
    navigate("/companies")
  }

  return (
    <Drawer open onOpenChange={(open) => !open && handleClose()}>
      <Drawer.Content>
        <Drawer.Header>
          <Heading className="capitalize">Edit Company</Heading>
        </Drawer.Header>

        {isLoading || !data?.company ? (
          <>
            <Drawer.Body className="flex items-center justify-center py-8">
              Loading...
            </Drawer.Body>
            <Drawer.Footer>
              <div className="flex items-center justify-end gap-x-2">
                <Button size="small" variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </Drawer.Footer>
          </>
        ) : (
          <EditCompanyForm
            key={data.company.id}
            company={data.company}
            onSubmit={(values) => updateMutation.mutate(values)}
            onCancel={handleClose}
            isPending={updateMutation.isPending}
          />
        )}
      </Drawer.Content>
    </Drawer>
  )
}

export default EditCompanyPage
