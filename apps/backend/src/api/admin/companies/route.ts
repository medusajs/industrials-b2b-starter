import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: companies,
    metadata: { count, take, skip } = {},
  } = await query.graph({
    entity: "company",
    ...req.queryConfig,
  })

  res.json({
    companies,
    count: count || 0,
    limit: take || 15,
    offset: skip || 0,
  })
}
