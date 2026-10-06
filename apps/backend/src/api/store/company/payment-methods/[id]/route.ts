import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export async function DELETE(
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
  if (!employee?.is_admin) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Only company admins can manage payment methods"
    )
  }

  if (!process.env.STRIPE_API_KEY) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Stripe is not configured. Cannot detach payment method."
    )
  }

  const Stripe = require("stripe").default || require("stripe")
  const stripe = new Stripe(process.env.STRIPE_API_KEY)

  await stripe.paymentMethods.detach(req.params.id)

  res.json({ id: req.params.id, object: "payment_method", deleted: true })
}
