import {
  createWorkflow,
  WorkflowResponse,
  when,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../modules/company"
import CompanyModuleService from "../../modules/company/service"
import {
  CompanyStatus,
  SpendLimitResetFrequency,
} from "../../modules/company/models"
import type { IPaymentModuleService } from "@medusajs/framework/types"
import { isStripeConfigured } from "../../utils/is-stripe-configured"

export type UpdateCompanyInput = {
  id: string
  name?: string
  email?: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country_code?: string | null
  logo_url?: string | null
  status?: CompanyStatus
  spend_limit_reset_frequency?: SpendLimitResetFrequency
}

type UpdateCompanyStepResult = {
  id: string
  name: string
  email: string
  status: string
  previous_status: string
  [key: string]: unknown
}

const updateCompanyStep = createStep(
  "update-company-step",
  async (input: UpdateCompanyInput, { container }) => {
    const companyModuleService: CompanyModuleService =
      container.resolve(COMPANY_MODULE)

    const { id, ...data } = input

    const previousCompany = await companyModuleService.retrieveCompany(id)

    const company = await companyModuleService.updateCompanies({
      id,
      ...data,
    })

    return new StepResponse(
      {
        ...(company as any),
        previous_status: previousCompany.status,
      } as UpdateCompanyStepResult,
      previousCompany as any
    )
  },
  async (previousCompany: any, { container }) => {
    if (!previousCompany) return

    const companyModuleService: CompanyModuleService =
      container.resolve(COMPANY_MODULE)

    await companyModuleService.updateCompanies({
      id: previousCompany.id,
      name: previousCompany.name,
      email: previousCompany.email,
      phone: previousCompany.phone,
      address: previousCompany.address,
      city: previousCompany.city,
      state: previousCompany.state,
      postal_code: previousCompany.postal_code,
      country_code: previousCompany.country_code,
      logo_url: previousCompany.logo_url,
      status: previousCompany.status,
      spend_limit_reset_frequency:
        previousCompany.spend_limit_reset_frequency,
    })
  }
)

const createAccountHolderStep = createStep(
  "create-account-holder-on-activation",
  async (
    input: { company_id: string; company_email: string },
    { container }
  ) => {
    if (!isStripeConfigured()) {
      return new StepResponse({ skipped: true }, null)
    }

    const paymentModuleService: IPaymentModuleService =
      container.resolve(Modules.PAYMENT)
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    const { data: existingLinks } = await query.graph({
      entity: "company",
      fields: ["account_holder.*"],
      filters: { id: input.company_id },
    })

    const existingAccountHolder = (existingLinks[0] as any)?.account_holder
    if (existingAccountHolder) {
      return new StepResponse({ skipped: true }, null)
    }

    const accountHolder = await paymentModuleService.createAccountHolder({
      provider_id: "pp_stripe_stripe",
      context: {
        customer: {
          id: input.company_id,
          email: input.company_email,
        },
      },
    })

    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    await link.create({
      [COMPANY_MODULE]: { company_id: input.company_id },
      [Modules.PAYMENT]: { account_holder_id: accountHolder.id },
    })

    return new StepResponse(
      { skipped: false, account_holder_id: accountHolder.id },
      { company_id: input.company_id, account_holder_id: accountHolder.id }
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const paymentModuleService: IPaymentModuleService =
      container.resolve(Modules.PAYMENT)
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any

    await link.dismiss({
      [COMPANY_MODULE]: { company_id: compensationData.company_id },
      [Modules.PAYMENT]: {
        account_holder_id: compensationData.account_holder_id,
      },
    })
    await paymentModuleService.deleteAccountHolder(
      compensationData.account_holder_id
    )
  }
)

export const updateCompanyWorkflow = createWorkflow(
  "update-company",
  function (input: UpdateCompanyInput) {
    const company = updateCompanyStep(input)

    const activationData = transform({ company }, ({ company }) => ({
      company_id: company.id,
      company_email: company.email,
      was_activated:
        company.status === "active" &&
        company.previous_status !== "active",
    }))

    when(activationData, ({ was_activated }) => was_activated).then(() => {
      createAccountHolderStep({
        company_id: activationData.company_id,
        company_email: activationData.company_email,
      })
    })

    return new WorkflowResponse(company)
  }
)
