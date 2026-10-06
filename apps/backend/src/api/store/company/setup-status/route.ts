import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../../modules/company"
import CompanyModuleService from "../../../../modules/company/service"
import { isStripeConfigured } from "../../../../utils/is-stripe-configured"

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

type StepDefinition = Omit<CompanySetupStep, "completed" | "required_for_checkout"> & {
  blocks_checkout?: boolean
}

const BASE_STEP_DEFINITIONS: StepDefinition[] = [
  {
    key: "shipping_address",
    label: "Default Shipping Address",
    description:
      "Add a shipping address and mark it as the default for your company.",
    link: "/settings?tab=addresses",
    blocks_checkout: true,
  },
  {
    key: "billing_address",
    label: "Default Billing Address",
    description:
      "Add a billing address and mark it as the default for your company.",
    link: "/settings?tab=addresses",
    blocks_checkout: true,
  },
  {
    key: "invite_employee",
    label: "Invite an Employee",
    description:
      "Invite team members so they can browse the catalog and place orders.",
    link: "/employees",
  },
]

const PAYMENT_METHOD_STEP: StepDefinition = {
  key: "payment_method",
  label: "Payment Method",
  description:
    "Add a saved payment method so your team can place orders.",
  link: "/settings?tab=payment_methods",
  blocks_checkout: true,
}

export async function getCompanySetupStatus(
  container: any,
  companyId: string
): Promise<CompanySetupStatus> {
  const companyService: CompanyModuleService = container.resolve(COMPANY_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Check addresses
  const addresses = await companyService.listCompanyAddresses({
    company_id: companyId,
  })

  const hasShippingAddress = addresses.some(
    (addr: any) => addr.is_default_shipping
  )
  const hasBillingAddress = addresses.some(
    (addr: any) => addr.is_default_billing
  )

  // Check if any employee invites have been sent for this company
  const { data: invites } = await query.graph({
    entity: "invite",
    fields: ["id", "metadata"],
    filters: { accepted: false },
    pagination: { skip: 0, take: 1000 },
  })

  const pendingInviteCount = invites.filter((invite: any) => {
    const meta = invite.metadata as any
    return meta?.type === "employee_invite" && meta?.company_id === companyId
  }).length

  // Also check if there are employees beyond the founding admin
  const employees = await companyService.listEmployees({
    company_id: companyId,
  })

  const hasInvitedEmployee = pendingInviteCount > 0 || employees.length > 1

  // Check saved payment methods (only if Stripe is configured)
  let hasPaymentMethod = false
  if (isStripeConfigured()) {
    try {
      const { data: companies } = await query.graph({
        entity: "company",
        fields: ["id", "account_holder.*"],
        filters: { id: companyId },
      })

      const accountHolder = (companies[0] as any)?.account_holder
      if (accountHolder) {
        const paymentModuleService = container.resolve(Modules.PAYMENT) as any
        const paymentMethods = await paymentModuleService.listPaymentMethods({
          provider_id: accountHolder.provider_id,
          context: {
            account_holder: {
              data: { id: accountHolder.data?.id },
            },
          },
        })
        hasPaymentMethod = paymentMethods.length > 0
      }
    } catch {
      // If payment module errors, treat as not configured
    }
  }

  const stepDefinitions: StepDefinition[] = isStripeConfigured()
    ? [...BASE_STEP_DEFINITIONS.slice(0, 2), PAYMENT_METHOD_STEP, BASE_STEP_DEFINITIONS[2]]
    : BASE_STEP_DEFINITIONS

  const completionMap: Record<string, boolean> = {
    shipping_address: hasShippingAddress,
    billing_address: hasBillingAddress,
    payment_method: hasPaymentMethod,
    invite_employee: hasInvitedEmployee,
  }

  const steps: CompanySetupStep[] = stepDefinitions.map((def) => ({
    key: def.key,
    label: def.label,
    description: def.description,
    link: def.link,
    completed: completionMap[def.key] || false,
    required_for_checkout: def.blocks_checkout ?? false,
  }))

  const completedCount = steps.filter((s) => s.completed).length
  const checkoutSteps = steps.filter((s) => s.required_for_checkout)
  const checkoutReady = checkoutSteps.every((s) => s.completed)

  return {
    completed: completedCount === steps.length,
    checkout_ready: checkoutReady,
    steps,
    completed_count: completedCount,
    total_count: steps.length,
  }
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
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
  if (!employee?.company) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Company not found")
  }

  const setupStatus = await getCompanySetupStatus(
    req.scope,
    employee.company.id
  )

  res.json({
    setup_status: setupStatus,
    company_status: employee.company.status,
    is_admin: employee.is_admin,
  })
}
