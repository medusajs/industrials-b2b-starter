import { sdk } from "@/lib/utils/sdk"
import { HttpTypes } from "@medusajs/types"

/**
 * Lists products with pagination support and filtering options.
 * 
 * @param page_param - The page number to fetch (defaults to 1)
 * @param query_params - Optional query parameters for filtering, sorting, and field selection
 * @param region_id - Optional region ID to get region-specific pricing and availability
 * @returns Promise that resolves to an object containing products array, total count, and next page number
 * 
 * @example
 * ```typescript
 * // Get first page of products
 * const { products, count, next_page } = await listProducts({
 *   region_id: 'reg_us'
 * });
 * 
 * // Get products with filtering
 * const { products } = await listProducts({
 *   page_param: 1,
 *   query_params: {
 *     limit: 20,
 *     offset: 0,
 *     collection_id: ['col_123'],
 *     category_id: ['cat_456'],
 *     q: 'search term',
 *     order: '-created_at'
 *   },
 *   region_id: 'reg_eu'
 * });
 * 
 * // Get products with specific fields
 * const { products } = await listProducts({
 *   query_params: {
 *     fields: '*variants, *images, *collection, *tags',
 *     limit: 10
 *   },
 *   region_id: 'reg_gb'
 * });
 * 
 * // Get next page
 * if (next_page) {
 *   const nextPageData = await listProducts({
 *     page_param: next_page,
 *     query_params,
 *     region_id
 *   });
 * }
 * ```
 */
export type ListProductsQueryParams = HttpTypes.StoreProductListParams & {
  option_value_id?: string | string[]
}

export const listProducts = async ({
  page_param = 1,
  query_params,
  region_id,
}: {
  page_param?: number;
  query_params?: ListProductsQueryParams;
  region_id?: string;
}): Promise<{
  products: HttpTypes.StoreProduct[];
  count: number;
  next_page: number | null;
}> => {
  const limit = query_params?.limit || 12
  const _page_param = Math.max(page_param, 1)
  const offset = _page_param === 1 ? 0 : (_page_param - 1) * limit

  const baseFields = query_params?.fields
  const fields = baseFields && baseFields.includes("*variants.options")
    ? baseFields
    : baseFields
      ? `${baseFields},*variants.options`
      : "*variants.options"

  const response = await sdk.store.product.list({
    limit,
    offset,
    region_id,
    ...query_params,
    fields,
  } as HttpTypes.StoreProductListParams)

  const next_page = offset + limit < response.count ? _page_param + 1 : null

  return {
    products: response.products,
    count: response.count,
    next_page,
  }
}

/**
 * Higher-level helper that fetches products with optional global option-value
 * filtering. Pass `optionValueIds` to scope results to variants that have any
 * of the supplied (global) product option values.
 */
export const listAndSortProducts = async ({
  page_param = 1,
  query_params,
  region_id,
  optionValueIds,
}: {
  page_param?: number;
  query_params?: ListProductsQueryParams;
  region_id?: string;
  optionValueIds?: string[];
}) => {
  const dedupedOptionValueIds = optionValueIds
    ? Array.from(new Set(optionValueIds.filter(Boolean)))
    : []

  const mergedParams: ListProductsQueryParams = {
    ...query_params,
    ...(dedupedOptionValueIds.length > 0
      ? { option_value_id: dedupedOptionValueIds }
      : {}),
  }

  return listProducts({
    page_param,
    query_params: mergedParams,
    region_id,
  })
}

/**
 * Retrieves a single product by its handle with optional region-specific data.
 * 
 * @param handle - The product handle (slug) to retrieve
 * @param region_id - Optional region ID to get region-specific pricing and availability
 * @param fields - Optional fields to include in the response
 * @returns Promise that resolves to the product data
 * @throws Error if product with the given handle is not found
 * 
 * @example
 * ```typescript
 * // Get product by handle
 * const product = await retrieveProduct({
 *   handle: 'awesome-t-shirt',
 *   region_id: 'reg_us'
 * });
 * 
 * // Get product with specific fields
 * const product = await retrieveProduct({
 *   handle: 'awesome-t-shirt',
 *   region_id: 'reg_eu',
 *   fields: '*variants, *images, *options, *options.values, *collection, *tags'
 * });
 * 
 * // Get product with inventory data
 * const product = await retrieveProduct({
 *   handle: 'awesome-t-shirt',
 *   region_id: 'reg_gb',
 *   fields: '*variants, +variants.inventory_quantity, +variants.manage_inventory, +variants.allow_backorder'
 * });
 * 
 * // Get product with price. Must start the fields with `*variants.calculated_price`
 * const product = await retrieveProduct({
 *   handle: 'awesome-t-shirt',
 *   region_id: 'reg_gb',
 *   fields: '*variants.calculated_price, handle'
 * });
 * 
 * // Handle errors
 * try {
 *   const product = await retrieveProduct({ handle: 'non-existent-product' });
 * } catch (error) {
 *   console.error('Product not found:', error.message);
 * }
 * ```
 */
export const retrieveProduct = async ({
  handle,
  region_id,
  fields,
}: {
  handle: string;
  region_id?: string;
  fields?: string;
}): Promise<HttpTypes.StoreProduct> => {
  const { products } = await sdk.store.product.list({
    handle: handle,
    region_id,
    fields: fields ||
      "*variants, +variants.inventory_quantity, +variants.manage_inventory, +variants.allow_backorder, *images, *options, *options.values, *collection, *tags",
  })

  if (!products || products.length === 0) {
    throw new Error(`Product with handle ${handle} not found`)
  }

  return products[0]
}
