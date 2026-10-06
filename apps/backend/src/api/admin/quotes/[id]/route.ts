import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  console.log("received fields are ", req.queryConfig.fields)

  const {
    data: [quote],
  } = await query.graph(
    {
      entity: "quote",
      filters: { id },
      fields: req.queryConfig.fields,
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ quote })
}
