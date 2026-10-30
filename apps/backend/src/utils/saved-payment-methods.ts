import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

/**
 * Providers are registered as `pp_{provider}_{id}`, where `{id}` is the ID set in `medusa-config.ts`. Company payment
 * methods are saved with your own Stripe account when it's registered, then Adyen, and otherwise with Medusa Payments
 * on Medusa Cloud, which registers a provider per payment account.
 */
const SAVED_PAYMENT_METHODS_PROVIDER_PREFIXES = [
  "pp_stripe_",
  "pp_adyen_",
  "pp_medusa-payments_",
]

export async function getSavedPaymentMethodsProviderId(
  container: MedusaContainer
): Promise<string | undefined> {
  const providers = await container
    .resolve(Modules.PAYMENT)
    .listPaymentProviders({ is_enabled: true }, { select: ["id"] })

  for (const prefix of SAVED_PAYMENT_METHODS_PROVIDER_PREFIXES) {
    const provider = providers.find(({ id }) => id.startsWith(prefix))
    if (provider) {
      return provider.id
    }
  }

  return undefined
}

export function isAdyenProvider(providerId?: string): boolean {
  return !!providerId?.startsWith("pp_adyen_")
}

export async function isSavedPaymentMethodsEnabled(
  container: MedusaContainer
): Promise<boolean> {
  return !!(await getSavedPaymentMethodsProviderId(container))
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

  return accountHolder.provider_id ===
    (await getSavedPaymentMethodsProviderId(container))
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
