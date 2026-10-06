import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { RequestWithCompany } from "../../../middlewares/require-employee-admin"

interface EmployeeInviteMetadata {
  type: "employee_invite"
  company_id: string
  company_name: string
  spending_limit: number | null
  is_admin: boolean
}

export async function GET(
  req: RequestWithCompany & MedusaRequest,
  res: MedusaResponse
) {
  const company_id = req.company_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Get pagination from queryConfig (set by validateAndTransformQuery middleware)
  const { pagination, fields } = req.queryConfig || {}
  const skip = pagination?.skip ?? 0
  const take = pagination?.take ?? 50
  const order = pagination?.order

  // Fetch invites with pagination from Query
  const {
    data: invites,
    metadata,
  } = await query.graph({
    entity: "invite",
    fields: fields || ["id", "email", "token", "accepted", "expires_at", "metadata", "created_at"],
    filters: {
      accepted: false,
    },
    pagination: {
      skip: 0, // We need all unaccepted invites to filter by company_id
      take: 1000, // Fetch a reasonable max to filter
      ...(order && { order }),
    },
  })

  // Filter invites that belong to this company and are employee invites
  // Note: We filter in memory because metadata is a JSON field
  const employeeInvites = invites.filter((invite: any) => {
    const inviteMetadata = invite.metadata as EmployeeInviteMetadata | null
    return (
      inviteMetadata?.type === "employee_invite" &&
      inviteMetadata?.company_id === company_id
    )
  })

  // Get total count before pagination
  const totalCount = employeeInvites.length

  // Apply pagination to filtered results
  const paginatedInvites = employeeInvites.slice(skip, skip + take)

  // Map to response format
  const formattedInvites = paginatedInvites.map((invite: any) => {
    const inviteMetadata = invite.metadata as EmployeeInviteMetadata
    return {
      id: invite.id,
      email: invite.email,
      token: invite.token,
      spending_limit: inviteMetadata.spending_limit,
      is_admin: inviteMetadata.is_admin,
      created_at: invite.created_at,
      expires_at: invite.expires_at,
    }
  })

  res.json({
    invites: formattedInvites,
    count: totalCount,
    offset: skip,
    limit: take,
  })
}
