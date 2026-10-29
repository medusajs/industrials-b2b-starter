import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  getSavedPaymentMethodsProviderId,
  listCompanyPaymentMethods,
  retrieveAdminCompany,
  retrieveCompanyAccountHolder,
} from "../../../../utils/saved-payment-methods"
import { createCompanyAccountHolderWorkflow } from "../../../../workflows/create-company-account-holder"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const company = await retrieveAdminCompany(req)
  const { accountHolder } = await retrieveCompanyAccountHolder(
    req.scope,
    company.id
  )

  res.json({
    payment_methods: await listCompanyPaymentMethods(req.scope, accountHolder),
  })
}

// Starts saving a card, which the storefront confirms with Stripe.js on the Stripe account the response names.
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const providerId = getSavedPaymentMethodsProviderId()
  if (!providerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Saved payment methods are not available. Configure Stripe or Medusa Payments."
    )
  }

  const company = await retrieveAdminCompany(req)
  let { accountHolder, staleAccountHolder } =
    await retrieveCompanyAccountHolder(req.scope, company.id)

  if (!accountHolder) {
    const { result } = await createCompanyAccountHolderWorkflow(req.scope).run({
      input: {
        company_id: company.id,
        company_name: company.name,
        company_email: company.email,
        provider_id: providerId,
        stale_account_holder_id: staleAccountHolder?.id,
      },
    })

    accountHolder = result
  }

  const paymentMethodSession = await req.scope
    .resolve(Modules.PAYMENT)
    .createPaymentMethods({
      provider_id: accountHolder.provider_id,
      context: {
        account_holder: {
          data: { id: accountHolder.data?.id },
        },
      },
      // Company cards are charged later, eg. when an order is approved.
      data: { allowed_payment_method_types: ["card"], usage: "off_session" },
    })

  res.json({
    client_secret: paymentMethodSession.data?.client_secret,
    // Medusa Payments saves the card on a Stripe connected account.
    stripe_account: paymentMethodSession.data?.stripe_account,
  })
}
