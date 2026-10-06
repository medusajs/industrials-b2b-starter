import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../../../../modules/company"
import CompanyModuleService from "../../../../../modules/company/service"

async function getAdminCompany(req: AuthenticatedMedusaRequest) {
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
  if (!employee?.is_admin) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Only company admins can manage addresses"
    )
  }

  const company = employee.company
  if (!company) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Company not found")
  }

  return { employee, company }
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { company } = await getAdminCompany(req)
  const addressId = req.params.id

  const companyService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  const existing = await companyService.retrieveCompanyAddress(addressId)
  if ((existing as any).company_id !== company.id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Address not found")
  }

  const body = req.validatedBody as Record<string, unknown>

  if (body.is_default_shipping || body.is_default_billing) {
    const allAddresses = await companyService.listCompanyAddresses({
      company_id: company.id,
    })

    const updates: { id: string; is_default_shipping?: boolean; is_default_billing?: boolean }[] = []

    for (const addr of allAddresses) {
      if (addr.id === addressId) continue
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

  const address = await companyService.updateCompanyAddresses({ id: addressId, ...body })

  res.json({ address })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { company } = await getAdminCompany(req)
  const addressId = req.params.id

  const companyService: CompanyModuleService = req.scope.resolve(COMPANY_MODULE)

  const existing = await companyService.retrieveCompanyAddress(addressId)
  if ((existing as any).company_id !== company.id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Address not found")
  }

  await companyService.deleteCompanyAddresses(addressId)

  res.json({ id: addressId, object: "company_address", deleted: true })
}
