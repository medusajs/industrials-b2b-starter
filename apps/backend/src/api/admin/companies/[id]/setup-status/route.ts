import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../../../modules/company"
import CompanyModuleService from "../../../../../modules/company/service"
import { isStripeConfigured } from "../../../../../utils/is-stripe-configured"

interface SetupStep {
  key: string
  label: string
  completed: boolean
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const companyId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const companyService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  let company
  try {
    company = await companyService.retrieveCompany(companyId)
  } catch {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Company not found")
  }

  const addresses = await companyService.listCompanyAddresses({
    company_id: company.id,
  })

  const hasShippingAddress = addresses.some(
    (addr: any) => addr.is_default_shipping
  )
  const hasBillingAddress = addresses.some(
    (addr: any) => addr.is_default_billing
  )

  let hasPaymentMethod = false
  if (isStripeConfigured()) {
    try {
      const { data: companies } = await query.graph({
        entity: "company",
        fields: ["id", "account_holder.*"],
        filters: { id: company.id },
      })

      const accountHolder = (companies[0] as any)?.account_holder
      if (accountHolder?.data?.id) {
        const paymentModuleService = req.scope.resolve(Modules.PAYMENT) as any
        const paymentMethods = await paymentModuleService.listPaymentMethods({
          provider_id: accountHolder.provider_id,
          context: {
            account_holder: {
              data: { id: accountHolder.data.id },
            },
          },
        })
        hasPaymentMethod = paymentMethods.length > 0
      }
    } catch {
      hasPaymentMethod = false
    }
  }

  const steps: SetupStep[] = [
    {
      key: "shipping_address",
      label: "Shipping address",
      completed: hasShippingAddress,
    },
    {
      key: "billing_address",
      label: "Billing address",
      completed: hasBillingAddress,
    },
    ...(isStripeConfigured()
      ? [
          {
            key: "payment_method",
            label: "Payment method",
            completed: hasPaymentMethod,
          },
        ]
      : []),
  ]

  const completedCount = steps.filter((s) => s.completed).length

  res.json({
    setup_status: {
      completed: completedCount === steps.length,
      steps,
      completed_count: completedCount,
      total_count: steps.length,
    },
  })
}
