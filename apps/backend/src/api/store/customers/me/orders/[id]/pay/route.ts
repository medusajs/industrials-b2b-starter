import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  listCompanyPaymentMethods,
  retrieveCompanyAccountHolder,
  retrieveEmployeeCompany,
} from "../../../../../../../utils/saved-payment-methods"

type PayOrderRequestBody = {
  /** The company payment method to charge, for card payments. */
  payment_method_id?: string
}

/**
 * Pays an order with the payment session selected on the order payment page. Card payments charge one of the
 * company's saved payment methods off-session, while manual payments are authorized, to be captured once paid.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<PayOrderRequestBody>,
  res: MedusaResponse
) => {
  const { id: orderId } = req.params
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Customer not authenticated")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Get the order and verify it belongs to this customer
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "customer_id",
      "currency_code",
      "payment_collections.id",
      "payment_collections.status",
      "payment_collections.amount",
      "payment_collections.payment_sessions.id",
      "payment_collections.payment_sessions.status",
      "payment_collections.payment_sessions.provider_id",
    ],
    filters: { id: orderId },
  })

  const order = orders[0]

  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }

  if (order.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Order does not belong to this customer")
  }

  // Find the unpaid payment collection
  const paymentCollection = order.payment_collections?.find(
    (pc: any) => pc.status === "not_paid"
  ) as any

  if (!paymentCollection) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No unpaid payment collection found for this order"
    )
  }

  let paymentSession = paymentCollection.payment_sessions?.find(
    (session: any) => session.status === "pending"
  )

  if (!paymentSession) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Select a payment method before paying for this order"
    )
  }

  const paymentModuleService = req.scope.resolve(Modules.PAYMENT)

  if (!paymentSession.provider_id.startsWith("pp_system_default")) {
    paymentSession = await createSavedPaymentMethodSession(req, {
      customerId,
      paymentCollection,
      currencyCode: order.currency_code,
      providerId: paymentSession.provider_id,
      paymentMethodId: req.body?.payment_method_id,
    })
  }

  const payment = await paymentModuleService
    .authorizePaymentSession(paymentSession.id, {})
    .catch((error: Error) => {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `The payment couldn't be completed: ${error.message}`
      )
    })

  // Fetch the updated order
  const { data: updatedOrders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "status",
      "payment_collections.id",
      "payment_collections.status",
    ],
    filters: { id: orderId },
  })

  res.status(200).json({
    order: updatedOrders[0],
    payment,
  })
}

// Replaces the selected session with one that charges the saved payment method right away, as the customer isn't
// there to confirm it.
async function createSavedPaymentMethodSession(
  req: AuthenticatedMedusaRequest,
  {
    customerId,
    paymentCollection,
    currencyCode,
    providerId,
    paymentMethodId,
  }: {
    customerId: string
    paymentCollection: any
    currencyCode: string
    providerId: string
    paymentMethodId?: string
  }
) {
  if (!paymentMethodId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Select one of your company's saved payment methods"
    )
  }

  const company = await retrieveEmployeeCompany(req.scope, customerId)
  const { accountHolder } = company
    ? await retrieveCompanyAccountHolder(req.scope, company.id)
    : { accountHolder: undefined }

  // The payment method has to be one of the company's, saved with the selected provider.
  const paymentMethods = await listCompanyPaymentMethods(
    req.scope,
    accountHolder
  )
  if (
    !accountHolder ||
    accountHolder.provider_id !== providerId ||
    !paymentMethods.some(({ id }) => id === paymentMethodId)
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment method ${paymentMethodId} not found`
    )
  }

  const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
  for (const session of paymentCollection.payment_sessions ?? []) {
    await paymentModuleService.deletePaymentSession(session.id).catch(() => {})
  }

  return await paymentModuleService.createPaymentSession(paymentCollection.id, {
    provider_id: providerId,
    amount: paymentCollection.amount,
    currency_code: currencyCode,
    data: {
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
    },
    context: {
      account_holder: {
        data: accountHolder.data,
      },
    },
  })
}
