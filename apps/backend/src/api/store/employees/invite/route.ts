import { MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createInvitesWorkflow } from "@medusajs/medusa/core-flows"
import { RequestWithCompany } from "../../../middlewares/require-employee-admin"

export async function POST(
  req: RequestWithCompany,
  res: MedusaResponse
) {
  const { company_id } = req

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { email, spending_limit, is_admin } = req.validatedBody as {
    email: string
    spending_limit?: number | null
    is_admin?: boolean
  }

  // Check if an employee with this email already exists in the company
  const { data: existingEmployees } = await query.graph({
    entity: "employee",
    fields: ["id", "customer.email"],
    filters: {
      company_id,
    },
  })

  const emailExists = existingEmployees.some(
    (emp: any) => emp.customer?.email?.toLowerCase() === email.toLowerCase()
  )

  if (emailExists) {
    throw new MedusaError(
      MedusaError.Types.CONFLICT,
      "An employee with this email already exists in your company"
    )
  }

  // Get company name for the invite metadata
  const { data: [company] } = await query.graph({
    entity: "company",
    fields: ["name"],
    filters: { id: company_id },
  })

  // Run the createInvitesWorkflow with employee metadata
  const { result } = await createInvitesWorkflow(req.scope).run({
    input: {
      invites: [{
        email,
        metadata: {
          type: "employee_invite",
          company_id,
          company_name: company?.name ?? "",
          spending_limit: spending_limit ?? null,
          is_admin: is_admin ?? false,
        },
      }],
    },
  })

  const invite = result[0]

  res.json({
    success: true,
    invite: {
      id: invite.id,
      email: invite.email,
      company_name: company?.name ?? "",
      spending_limit: spending_limit ?? null,
      is_admin: is_admin ?? false,
    },
  })
}
