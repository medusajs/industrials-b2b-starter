import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../modules/company"
import CompanyModuleService from "../../modules/company/service"
import {
  listCompanyPaymentMethods,
  retrieveCompanyAccountHolder,
} from "../../utils/saved-payment-methods"

/**
 * Middleware that checks if the authenticated customer's company
 * has completed setup (shipping address, billing address, payment method).
 * If setup is incomplete, the request is rejected with a 422 error.
 *
 * Only applies to B2B employees. Non-employee customers pass through.
 */
export async function requireCompanySetup(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return next()
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  let employee: any
  try {
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "employee.*", "employee.company.*"],
      filters: { id: customerId },
    })
    employee = (customers[0] as any)?.employee
  } catch {
    return next()
  }

  // Not a B2B employee -- skip the check
  if (!employee?.company) {
    return next()
  }

  const company = employee.company

  // Company must be active
  if (company.status !== "active") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Your company account is not active. Please contact your administrator."
    )
  }

  const companyService: CompanyModuleService =
    req.scope.resolve(COMPANY_MODULE)

  const addresses = await companyService.listCompanyAddresses({
    company_id: company.id,
  })

  const hasShipping = addresses.some((addr: any) => addr.is_default_shipping)
  const hasBilling = addresses.some((addr: any) => addr.is_default_billing)

  // Check payment methods (only required if company has an account holder for the configured Stripe or Medusa
  // Payments provider)
  let hasPaymentMethod = false
  let hasAccountHolder = false
  try {
    const { accountHolder } = await retrieveCompanyAccountHolder(
      req.scope,
      company.id
    )
    hasAccountHolder = !!accountHolder
    hasPaymentMethod =
      (await listCompanyPaymentMethods(req.scope, accountHolder)).length > 0
  } catch {
    // Treat as not configured
  }

  const missing: string[] = []
  if (!hasShipping) missing.push("shipping address")
  if (!hasBilling) missing.push("billing address")
  if (hasAccountHolder && !hasPaymentMethod) missing.push("payment method")

  if (missing.length > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Company setup is incomplete. A company admin must configure: ${missing.join(", ")}. Go to Settings to complete setup.`
    )
  }

  return next()
}
