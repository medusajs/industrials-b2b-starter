import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { deleteCompanyWorkflow } from "../../../../workflows/delete-company"
import { updateCompanyWorkflow, UpdateCompanyInput } from "../../../../workflows/update-company"
import { COMPANY_MODULE } from "../../../../modules/company"
import CompanyModuleService from "../../../../modules/company/service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const companyModuleService: CompanyModuleService =
    req.scope.resolve(COMPANY_MODULE)

  const company = await companyModuleService.retrieveCompany(req.params.id)

  res.json({ company })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<Omit<UpdateCompanyInput, "id">>,
  res: MedusaResponse
) => {
  const { result } = await updateCompanyWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.body,
    },
  })

  res.json({ company: result })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteCompanyWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json({
    id: req.params.id,
    object: "company",
    deleted: true,
  })
}
