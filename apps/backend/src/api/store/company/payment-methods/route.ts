import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  getSavedPaymentMethodsProviderId,
  isAdyenProvider,
  listCompanyPaymentMethods,
  retrieveAdminCompany,
  retrieveCompanyAccountHolder,
} from "../../../../utils/saved-payment-methods"

type SavePaymentMethodRequestBody = {
  /** With Adyen, the card details collected by Adyen's Card component (`state.data.paymentMethod`). */
  payment_method?: Record<string, unknown>
}
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
    // The storefront collects card details differently for each provider.
    provider_id: await getSavedPaymentMethodsProviderId(req.scope),
  })
}

// With Stripe and Medusa Payments, starts saving a card, which the storefront confirms with Stripe.js on the Stripe
// account the response names. With Adyen, saves the card collected by Adyen's Card component.
export async function POST(
  req: AuthenticatedMedusaRequest<SavePaymentMethodRequestBody>,
  res: MedusaResponse
) {
  const providerId = await getSavedPaymentMethodsProviderId(req.scope)
  if (!providerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Saved payment methods are not available. Configure Medusa Payments."
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

  if (isAdyenProvider(accountHolder.provider_id)) {
    if (!req.body?.payment_method) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Enter the card details to save"
      )
    }

    const paymentMethod = await req.scope
      .resolve(Modules.PAYMENT)
      .createPaymentMethods({
        provider_id: accountHolder.provider_id,
        context: {
          account_holder: {
            data: { id: accountHolder.data?.id },
          },
        },
        // Company cards are charged later, eg. when an order is approved.
        data: { payment_method: req.body.payment_method, usage: "off_session" },
      })

    res.json({ payment_method: paymentMethod })
    return
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
