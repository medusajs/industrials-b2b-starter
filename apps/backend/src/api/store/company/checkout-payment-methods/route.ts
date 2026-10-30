import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  listCompanyPaymentMethods,
  retrieveCompanyAccountHolder,
} from "../../../../utils/saved-payment-methods"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.json({ payment_methods: [] })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.*", "employee.company.*"],
    filters: { id: customerId },
  })

  const employee = (customers[0] as any)?.employee
  if (!employee) {
    res.json({ payment_methods: [] })
    return
  }

  const company = employee.company
  if (!company || company.status !== "active") {
    res.json({ payment_methods: [] })
    return
  }

  const { accountHolder } = await retrieveCompanyAccountHolder(
    req.scope,
    company.id
  )

  // Each payment method has the `provider_id` that checkout initiates its payment session with.
  res.json({
    payment_methods: await listCompanyPaymentMethods(req.scope, accountHolder),
  })
}
