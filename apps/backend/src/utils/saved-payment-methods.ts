import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

/**
 * Company payment methods are saved with your own Stripe account when it's configured, then Adyen, and otherwise with
 * Medusa Payments on Medusa Cloud, which registers a provider per payment account.
 */
export function getSavedPaymentMethodsProviderId(): string | undefined {
  if (process.env.STRIPE_API_KEY) {
    return "pp_stripe_stripe"
  }

  if (process.env.ADYEN_API_KEY) {
    return "pp_adyen_adyen"
  }

  const [paymentAccount] = (process.env.MEDUSA_CLOUD_PAYMENT_ACCOUNTS ?? "")
    .split(",")
    .map((account) => account.trim())
    .filter(Boolean)

  if (process.env.MEDUSA_CLOUD_PAYMENTS_ENDPOINT && paymentAccount) {
    return `pp_medusa-payments_${paymentAccount}`
  }

  return undefined
}

export function isAdyenProvider(providerId?: string): boolean {
  return !!providerId?.startsWith("pp_adyen_")
}

export function isSavedPaymentMethodsEnabled(): boolean {
  return !!getSavedPaymentMethodsProviderId()
}

/**
 * An account holder only holds payment methods for the provider it was created with, so one created for another
 * provider, eg. before switching from Stripe to Medusa Payments, is returned as stale.
 */
export async function retrieveCompanyAccountHolder(
  container: MedusaContainer,
  companyId: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: companies } = await query.graph({
    entity: "company",
    fields: ["id", "account_holder.*"],
    filters: { id: companyId },
  })

  const accountHolder = (companies[0] as any)?.account_holder
  if (!accountHolder) {
    return { accountHolder: undefined, staleAccountHolder: undefined }
  }

  return accountHolder.provider_id === getSavedPaymentMethodsProviderId()
    ? { accountHolder, staleAccountHolder: undefined }
    : { accountHolder: undefined, staleAccountHolder: accountHolder }
}

export async function listCompanyPaymentMethods(
  container: MedusaContainer,
  accountHolder: { provider_id: string; data?: Record<string, unknown> } | undefined
) {
  if (!accountHolder?.data?.id) {
    return []
  }

  return await container.resolve(Modules.PAYMENT).listPaymentMethods({
    provider_id: accountHolder.provider_id,
    context: {
      account_holder: {
        data: { id: accountHolder.data.id },
      },
    },
  })
}

// Payment methods are managed by company admins.
export async function retrieveAdminCompany(req: AuthenticatedMedusaRequest) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.*", "employee.company.*"],
    filters: { id: customerId },
  })

  const employee = (customers[0] as any)?.employee
  if (!employee?.is_admin) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Only company admins can manage payment methods"
    )
  }

  const company = employee.company
  if (!company) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Company not found")
  }

  return company
}

// Any employee can pay with their company's payment methods, while only admins manage them.
export async function retrieveEmployeeCompany(
  container: MedusaContainer,
  customerId: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.*", "employee.company.*"],
    filters: { id: customerId },
  })

  const company = (customers[0] as any)?.employee?.company
  return company?.status === "active" ? company : undefined
}
