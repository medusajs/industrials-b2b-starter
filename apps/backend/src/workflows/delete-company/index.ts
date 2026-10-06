import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { COMPANY_MODULE } from "../../modules/company"
import CompanyModuleService from "../../modules/company/service"

type DeleteCompanyInput = {
  id: string
}

const deleteCompanyStep = createStep(
  "delete-company-step",
  async (input: DeleteCompanyInput, { container }) => {
    const companyModuleService: CompanyModuleService =
      container.resolve(COMPANY_MODULE)

    await companyModuleService.softDeleteCompanies(input.id)

    return new StepResponse(undefined, input.id)
  },
  async (id, { container }) => {
    if (!id) return

    const companyModuleService: CompanyModuleService =
      container.resolve(COMPANY_MODULE)

    await companyModuleService.restoreCompanies(id)
  }
)

export const deleteCompanyWorkflow = createWorkflow(
  "delete-company",
  (input: DeleteCompanyInput) => {
    deleteCompanyStep(input)

    return new WorkflowResponse(undefined)
  }
)
