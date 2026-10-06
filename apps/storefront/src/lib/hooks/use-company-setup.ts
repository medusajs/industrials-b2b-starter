import { useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/utils/sdk"
import { useAuth } from "@/lib/hooks/use-auth"

export interface CompanySetupStep {
  key: string
  label: string
  description: string
  completed: boolean
  link: string
  required_for_checkout: boolean
}

export interface CompanySetupStatus {
  completed: boolean
  checkout_ready: boolean
  steps: CompanySetupStep[]
  completed_count: number
  total_count: number
}

export function useCompanySetupStatus() {
  const { isAuthenticated, isAdmin } = useAuth()

  return useQuery({
    queryKey: ["company-setup-status"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{
        setup_status: CompanySetupStatus
      }>("/store/company/setup-status", { method: "GET" })
      return response.setup_status
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useInvalidateSetupStatus() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ["company-setup-status"] })
}
