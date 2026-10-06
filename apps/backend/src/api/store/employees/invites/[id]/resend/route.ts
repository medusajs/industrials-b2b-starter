import { MedusaResponse } from "@medusajs/framework/http"
import { refreshInviteTokensWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { RequestWithCompany } from "../../../../../middlewares/require-employee-admin"

export async function POST(req: RequestWithCompany, res: MedusaResponse) {
  const { id } = req.params
  const company_id = req.company_id

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Verify the invite belongs to this company
  const { data: invites } = await query.graph({
    entity: "invite",
    fields: ["id", "metadata"],
    filters: { id },
  })

  if (!invites.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Invite not found")
  }

  const invite = invites[0]
  const metadata = invite.metadata as { company_id?: string; type?: string } | null

  if (
    metadata?.type !== "employee_invite" ||
    metadata?.company_id !== company_id
  ) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You can only resend invites for your company"
    )
  }

  // Refresh the invite token
  const { result } = await refreshInviteTokensWorkflow(req.scope).run({
    input: {
      invite_ids: [id],
    },
  })

  res.json({ invite: result[0] })
}
