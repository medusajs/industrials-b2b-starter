import { sdk } from "@/lib/utils/sdk"

export interface Employee {
  id: string
  is_admin: boolean
  spending_limit: number | null
  company_id: string
  company?: {
    id: string
    name: string
    email: string
    status: string
    logo_url: string | null
  }
}

export interface CustomerWithEmployee {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  company_name: string | null
  employee?: Employee
}

export async function getMe(): Promise<{ customer: CustomerWithEmployee }> {
  return await sdk.client.fetch<{ customer: CustomerWithEmployee }>("/store/me", {
    method: "GET",
  })
}

export interface EmployeeListItem {
  id: string
  is_admin: boolean
  spending_limit: number | null
  created_at: string
  customer: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }
}

export interface EmployeesResponse {
  employees: EmployeeListItem[]
  count: number
  limit: number
  offset: number
  page: number
  pageCount: number
}

export async function getEmployees(params: {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}): Promise<EmployeesResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set("page", String(params.page))
  if (params.limit) searchParams.set("limit", String(params.limit))
  if (params.search) searchParams.set("search", params.search)
  if (params.sortBy) searchParams.set("sortBy", params.sortBy)
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder)

  const queryString = searchParams.toString()
  const url = `/store/employees${queryString ? `?${queryString}` : ""}`

  return await sdk.client.fetch<EmployeesResponse>(url, {
    method: "GET",
  })
}

export async function updateEmployeeSpendingLimit(
  employeeId: string,
  spendingLimit: number | null
): Promise<{ employee: EmployeeListItem }> {
  return await sdk.client.fetch<{ employee: EmployeeListItem }>(
    `/store/employees/${employeeId}`,
    {
      method: "POST",
      body: { spending_limit: spendingLimit },
    }
  )
}

export interface InviteEmployeeInput {
  email: string
  spending_limit?: number | null
  is_admin?: boolean
}

export interface InviteEmployeeResponse {
  success: boolean
  invite: {
    email: string
    company_name: string
    spending_limit: number | null
    is_admin: boolean
  }
}

export async function inviteEmployee(
  input: InviteEmployeeInput
): Promise<InviteEmployeeResponse> {
  return await sdk.client.fetch<InviteEmployeeResponse>(
    "/store/employees/invite",
    {
      method: "POST",
      body: input,
    }
  )
}

export interface EmployeeInvite {
  id: string
  email: string
  token: string
  spending_limit: number | null
  is_admin: boolean
  created_at: string
  expires_at: string
}

export interface EmployeeInvitesResponse {
  invites: EmployeeInvite[]
  count: number
  offset: number
  limit: number
}

export async function getEmployeeInvites(): Promise<EmployeeInvitesResponse> {
  return await sdk.client.fetch<EmployeeInvitesResponse>(
    "/store/employees/invites",
    {
      method: "GET",
    }
  )
}

export async function getEmployeeInvitesCount(): Promise<{ count: number }> {
  const response = await sdk.client.fetch<EmployeeInvitesResponse>(
    "/store/employees/invites?limit=1",
    {
      method: "GET",
    }
  )
  return { count: response.count }
}

export async function resendEmployeeInvite(
  inviteId: string
): Promise<{ invite: EmployeeInvite }> {
  return await sdk.client.fetch<{ invite: EmployeeInvite }>(
    `/store/employees/invites/${inviteId}/resend`,
    {
      method: "POST",
    }
  )
}
