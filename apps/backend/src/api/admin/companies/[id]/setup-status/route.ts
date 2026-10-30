import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../../../modules/company"
import CompanyModuleService from "../../../../../modules/company/service"
import {
  isSavedPaymentMethodsEnabled,
  listCompanyPaymentMethods,
  retrieveCompanyAccountHolder,
} from "../../../../../utils/saved-payment-methods"

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

  const savedPaymentMethodsEnabled = await isSavedPaymentMethodsEnabled(
    req.scope
  )
  let hasPaymentMethod = false
  if (savedPaymentMethodsEnabled) {
    try {
      const { accountHolder } = await retrieveCompanyAccountHolder(
        req.scope,
        company.id
      )
      hasPaymentMethod =
        (await listCompanyPaymentMethods(req.scope, accountHolder)).length > 0
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
    ...(savedPaymentMethodsEnabled
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
