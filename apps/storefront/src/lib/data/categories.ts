import { sdk } from "@/lib/utils/sdk"
import { HttpTypes } from "@medusajs/types"
import { cachedOnServer } from "@/lib/utils/server-cache"

const CATEGORIES_TTL_MS = 5 * 60 * 1000
const CATEGORIES_STALE_MS = 60 * 60 * 1000

export const listCategories = async (options?: {
  fields?: string;
  queryParams?: HttpTypes.StoreProductCategoryListParams;
}): Promise<HttpTypes.StoreProductCategory[]> => {
  const query = { fields: options?.fields, ...options?.queryParams }
  const { product_categories } = await cachedOnServer(
    `categories:${JSON.stringify(query)}`,
    CATEGORIES_TTL_MS,
    () => sdk.store.category.list(query),
    CATEGORIES_STALE_MS
  )

  return product_categories
}

export const retrieveCategory = async ({
  handle,
  fields,
}: {
  handle: string;
  fields?: string;
}): Promise<HttpTypes.StoreProductCategory | null> => {
  const product_categories = await listCategories({
    queryParams: {
      handle,
      fields
    },
  })

  if (!product_categories.length) {
    throw new Error(`Category with handle ${handle} not found`)
  }

  return product_categories[0]
}