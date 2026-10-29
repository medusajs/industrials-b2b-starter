import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../modules/company"
import type { IPaymentModuleService } from "@medusajs/framework/types"

type CreateCompanyAccountHolderInput = {
  company_id: string
  company_name: string
  company_email: string
  provider_id: string
  /** The account holder of another provider the company is linked to, which the new one replaces. */
  stale_account_holder_id?: string
}

const unlinkStaleAccountHolderStep = createStep(
  "unlink-stale-account-holder-from-company",
  async (
    input: { company_id: string; account_holder_id?: string },
    { container }
  ) => {
    if (!input.account_holder_id) {
      return new StepResponse(undefined, null)
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    await link.dismiss({
      [COMPANY_MODULE]: { company_id: input.company_id },
      [Modules.PAYMENT]: { account_holder_id: input.account_holder_id },
    })

    return new StepResponse(undefined, input)
  },
  async (compensationData, { container }) => {
    if (!compensationData?.account_holder_id) return
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    await link.create({
      [COMPANY_MODULE]: { company_id: compensationData.company_id },
      [Modules.PAYMENT]: {
        account_holder_id: compensationData.account_holder_id,
      },
    })
  }
)

const createAccountHolderStep = createStep(
  "create-account-holder-for-company",
  async (input: CreateCompanyAccountHolderInput, { container }) => {
    const paymentModuleService: IPaymentModuleService =
      container.resolve(Modules.PAYMENT)

    const accountHolder = await paymentModuleService.createAccountHolder({
      provider_id: input.provider_id,
      context: {
        customer: {
          id: input.company_id,
          email: input.company_email,
        },
      },
    })

    return new StepResponse(accountHolder, {
      account_holder_id: accountHolder.id,
    })
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const paymentModuleService: IPaymentModuleService =
      container.resolve(Modules.PAYMENT)
    await paymentModuleService.deleteAccountHolder(
      compensationData.account_holder_id
    )
  }
)

const linkAccountHolderToCompanyStep = createStep(
  "link-account-holder-to-company",
  async (
    input: { company_id: string; account_holder_id: string },
    { container }
  ) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any

    await link.create({
      [COMPANY_MODULE]: { company_id: input.company_id },
      [Modules.PAYMENT]: { account_holder_id: input.account_holder_id },
    })

    return new StepResponse(undefined, input)
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    await link.dismiss({
      [COMPANY_MODULE]: { company_id: compensationData.company_id },
      [Modules.PAYMENT]: {
        account_holder_id: compensationData.account_holder_id,
      },
    })
  }
)

export const createCompanyAccountHolderWorkflow = createWorkflow(
  "create-company-account-holder",
  function (input: CreateCompanyAccountHolderInput) {
    unlinkStaleAccountHolderStep({
      company_id: input.company_id,
      account_holder_id: input.stale_account_holder_id,
    })
    const accountHolder = createAccountHolderStep(input)

    linkAccountHolderToCompanyStep({
      company_id: input.company_id,
      account_holder_id: accountHolder.id,
    })

    return new WorkflowResponse(accountHolder)
  }
)
