import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { HttpTypes } from "@medusajs/types"

import { queryKeys } from "@/lib/utils/query-keys"
import { sdk } from "@/lib/utils/sdk"

const PRODUCT_FIELDS =
  "*variants.calculated_price,*categories,*images,*variants.options,*collection"

export const useSearchProducts = ({
  ids,
  region_id,
}: {
  ids: string[]
  region_id?: string
}) => {
  return useQuery({
    queryKey: queryKeys.products.list("search-hits", region_id, ids),
    queryFn: async () => {
      if (!ids.length) {
        return [] as HttpTypes.StoreProduct[]
      }

      const { products } = await sdk.store.product.list({
        id: ids,
        limit: ids.length,
        region_id,
        fields: PRODUCT_FIELDS,
      } as HttpTypes.StoreProductListParams)

      const byId = new Map(products.map((product) => [product.id, product]))

      return ids
        .map((id) => byId.get(id))
        .filter((product): product is HttpTypes.StoreProduct =>
          Boolean(product)
        )
    },
    enabled: !!region_id,
    placeholderData: keepPreviousData,
  })
}

export default useSearchProducts
