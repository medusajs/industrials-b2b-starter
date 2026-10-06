import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../../modules/company"
import CompanyModuleService from "../../../../modules/company/service"

async function getEmployeeCompany(req: AuthenticatedMedusaRequest) {
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
  if (!employee) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Employee not found")
  }

  const company = employee.company
  if (!company) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Company not found")
  }

  return { employee, company }
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { company } = await getEmployeeCompany(req)

  const companyService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  const addresses = await companyService.listCompanyAddresses(
    { company_id: company.id },
    { order: { created_at: "ASC" } }
  )

  res.json({ addresses })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { employee, company } = await getEmployeeCompany(req)

  if (!employee.is_admin) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Only company admins can manage addresses"
    )
  }

  const companyService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  const body = req.validatedBody as {
    name: string
    first_name: string
    last_name: string
    company_name?: string
    address_1: string
    address_2?: string
    city: string
    province?: string
    postal_code: string
    country_code: string
    phone?: string
    is_default_shipping?: boolean
    is_default_billing?: boolean
  }

  if (body.is_default_shipping || body.is_default_billing) {
    const existing = await companyService.listCompanyAddresses({
      company_id: company.id,
    })

    const updates: { id: string; is_default_shipping?: boolean; is_default_billing?: boolean }[] = []

    for (const addr of existing) {
      const patch: Record<string, boolean> = {}
      if (body.is_default_shipping && (addr as any).is_default_shipping) {
        patch.is_default_shipping = false
      }
      if (body.is_default_billing && (addr as any).is_default_billing) {
        patch.is_default_billing = false
      }
      if (Object.keys(patch).length > 0) {
        updates.push({ id: addr.id, ...patch })
      }
    }

    if (updates.length > 0) {
      await Promise.all(
        updates.map((u) => companyService.updateCompanyAddresses(u))
      )
    }
  }

  const address = await companyService.createCompanyAddresses({
    ...body,
    company_id: company.id,
  })

  res.status(201).json({ address })
}
