import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  listCompanyPaymentMethods,
  retrieveAdminCompany,
  retrieveCompanyAccountHolder,
} from "../../../../../utils/saved-payment-methods"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const company = await retrieveAdminCompany(req)
  const { accountHolder } = await retrieveCompanyAccountHolder(
    req.scope,
    company.id
  )

  // Only the company's own payment methods can be removed.
  const paymentMethods = await listCompanyPaymentMethods(
    req.scope,
    accountHolder
  )
  if (!accountHolder || !paymentMethods.some(({ id }) => id === req.params.id)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment method ${req.params.id} not found`
    )
  }

  await req.scope.resolve(Modules.PAYMENT).deletePaymentMethods({
    id: req.params.id,
    provider_id: accountHolder.provider_id,
    context: {
      account_holder: {
        data: { id: accountHolder.data?.id },
      },
    },
  })

  res.json({ id: req.params.id, object: "payment_method", deleted: true })
}
