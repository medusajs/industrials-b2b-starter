import { sdk } from "@/lib/utils/sdk"

/**
 * Company data for creating a new company
 */
export interface CompanyInput {
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country_code?: string
}

/**
 * Admin user data for company creation
 */
export interface AdminInput {
  first_name: string
  last_name: string
  phone?: string
}

/**
 * Response from company creation API
 */
export interface CreateCompanyResponse {
  company: {
    id: string
    name: string
    email: string
    status: string
  }
  employee: {
    id: string
    is_admin: boolean
  }
  customer: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
}

/**
 * Registers a company with an admin user atomically.
 * 
 * This function calls the backend's setupCompanyWorkflow which handles:
 * 1. Creating the auth identity (emailpass)
 * 2. Creating and linking the customer record
 * 3. Creating the company
 * 4. Creating the admin employee
 * 5. Linking employee to customer
 * 
 * If any step fails, all changes are rolled back automatically.
 * 
 * @param email - The email address for authentication
 * @param password - The password for authentication (min 8 characters)
 * @param company - Company details (name, email, address, etc.)
 * @param admin - Admin user details (first_name, last_name, phone)
 * @returns Promise that resolves to the created company, employee, and customer data
 * @throws Error if registration fails (all changes are rolled back)
 * 
 * @example
 * ```typescript
 * const result = await registerCompany({
 *   email: "admin@acmecorp.com",
 *   password: "securepassword123",
 *   company: {
 *     name: "Acme Corporation",
 *     email: "info@acmecorp.com",
 *     phone: "+1 555-0100",
 *     address: "123 Business Ave",
 *     city: "San Francisco",
 *     state: "CA",
 *     postal_code: "94102",
 *     country_code: "us"
 *   },
 *   admin: {
 *     first_name: "John",
 *     last_name: "Doe"
 *   }
 * })
 * ```
 */
export const registerCompany = async ({
  email,
  password,
  company,
  admin,
}: {
  email: string
  password: string
  company: CompanyInput
  admin: AdminInput
}): Promise<CreateCompanyResponse> => {
  // Build the request body with only defined values
  const body: Record<string, unknown> = {
    email,
    password,
    company_name: company.name,
    company_email: company.email,
    admin_first_name: admin.first_name,
    admin_last_name: admin.last_name,
  }

  // Add optional company fields
  if (company.phone) body.company_phone = company.phone
  if (company.address) body.address = company.address
  if (company.city) body.city = company.city
  if (company.state) body.state = company.state
  if (company.postal_code) body.postal_code = company.postal_code
  if (company.country_code) body.country_code = company.country_code

  // Add optional admin fields
  if (admin.phone) body.admin_phone = admin.phone

  const response = await sdk.client.fetch<CreateCompanyResponse>("/store/company", {
    method: "POST",
    body,
  })

  return response
}

/**
 * Logs in a customer with the emailpass provider.
 * Call this after registerCompany to authenticate the admin user.
 * 
 * @param email - The email address for authentication
 * @param password - The password for authentication
 * @returns Promise that resolves when login is successful
 * @throws Error if login fails
 * 
 * @example
 * ```typescript
 * await loginCustomer({
 *   email: "admin@acmecorp.com",
 *   password: "securepassword123"
 * })
 * ```
 */
export const loginCustomer = async ({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<void> => {
  await sdk.auth.login("customer", "emailpass", {
    email,
    password,
  })
}
