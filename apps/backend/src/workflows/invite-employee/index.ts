import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createInvitesWorkflow, emitEventStep } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type InviteEmployeeInput = {
  company_id: string
  email: string
  spending_limit?: number | null
  is_admin?: boolean
  invited_by_customer_id: string
}

const validateCompanyStep = createStep(
  "validate-company-step",
  async (input: { company_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    const { data: companies } = await query.graph({
      entity: "company",
      fields: ["id", "name"],
      filters: { id: input.company_id },
    })

    if (!companies.length) {
      throw new Error(`Company ${input.company_id} not found`)
    }

    return new StepResponse(companies[0])
  }
)

export const inviteEmployeeWorkflow = createWorkflow(
  "invite-employee-workflow",
  function (input: InviteEmployeeInput) {
    // Step 1: Validate company exists
    const company = validateCompanyStep({ company_id: input.company_id })

    // Step 2: Prepare invite input with metadata containing employee info
    const inviteInput = transform(
      { input, company },
      ({ input, company }) => ({
        invites: [
          {
            email: input.email,
            metadata: {
              type: "employee_invite",
              company_id: input.company_id,
              company_name: company.name,
              spending_limit: input.spending_limit ?? null,
              is_admin: input.is_admin ?? false,
              invited_by: input.invited_by_customer_id,
            },
          },
        ],
      })
    )

    // Step 3: Create invite using core workflow (this generates the token properly)
    const createdInvites = createInvitesWorkflow.runAsStep({
      input: inviteInput,
    })

    // Step 4: Transform result to get invite data
    const inviteResult = transform(
      { createdInvites, input, company },
      ({ createdInvites, input, company }) => {
        const invite = createdInvites[0]
        return {
          invite_id: invite.id,
          token: invite.token,
          email: invite.email,
          company_id: input.company_id,
          company_name: company.name,
          spending_limit: input.spending_limit ?? null,
          is_admin: input.is_admin ?? false,
        }
      }
    )

    // Step 5: Emit event for sending invite email
    emitEventStep({
      eventName: "employee.invited",
      data: inviteResult,
    })

    return new WorkflowResponse(inviteResult)
  }
)

export default inviteEmployeeWorkflow
