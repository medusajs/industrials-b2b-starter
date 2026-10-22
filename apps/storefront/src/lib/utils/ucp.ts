import { isVariantInStock } from "@/lib/utils/product"
import { HttpTypes } from "@medusajs/types"

export const UCP_VERSION = "2026-08-25"
export const UCP_REST_BASE_PATH = "/ucp/v1"
export const UCP_MCP_PATH = "/ucp/mcp"

const capability = (path: string, schema: string) => ({
  spec: `https://ucp.dev/${UCP_VERSION}/specification/shopping/${path}`,
  schema: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/${schema}.json`,
})

export const UCP_CAPABILITIES = {
  "dev.ucp.shopping.catalog.search": capability("catalog/search", "catalog_search"),
  "dev.ucp.shopping.catalog.lookup": capability("catalog/lookup", "catalog_lookup"),
  "dev.ucp.shopping.cart": capability("cart", "cart"),
  "dev.ucp.shopping.checkout": capability("checkout", "checkout"),
} as const

export type CapabilityName = keyof typeof UCP_CAPABILITIES

export type UcpResult = { status: number; body: Record<string, unknown> }

export const UCP_PRODUCT_FIELDS =
  "id,title,handle,description,thumbnail,*images,*options,*variants,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.options"

export const UCP_CART_FIELDS =
  "id,email,currency_code,region_id,completed_at,metadata,*items,*region.countries,*shipping_address"

// Prices are only shown to signed-in business accounts, so UCP responses carry no amounts.
export const PRICING_MESSAGE = {
  type: "info",
  code: "pricing_requires_sign_in",
  content:
    "Prices are shown to signed-in business accounts. The buyer sees pricing and pays after signing in at continue_url.",
}

export const ucpResult = (
  name: CapabilityName,
  body: Record<string, unknown>,
  status = 200
): UcpResult => ({
  status,
  body: {
    ucp: {
      version: UCP_VERSION,
      status: status < 400 ? "success" : "error",
      capabilities: { [name]: [{ version: UCP_VERSION }] },
      ...(name === "dev.ucp.shopping.checkout" ? { payment_handlers: {} } : {}),
    },
    ...body,
  },
})

export const ucpError = (
  name: CapabilityName,
  status: number,
  code: string,
  content: string
): UcpResult =>
  ucpResult(
    name,
    {
      messages: [
        {
          type: "error",
          code,
          content,
          severity: status >= 500 ? "recoverable" : "unrecoverable",
        },
      ],
    },
    status
  )

export const toResponse = ({ status, body }: UcpResult) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } })

export const readJsonBody = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const body = await request.json()
    return body && typeof body === "object" && !Array.isArray(body) ? body : null
  } catch {
    return null
  }
}

export const toUcpProduct = (product: HttpTypes.StoreProduct, productUrl: string) => {
  const optionTitles = new Map(
    (product.options ?? []).map((option) => [option.id, option.title])
  )

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description ?? "",
    url: productUrl,
    media: (product.images ?? []).map((image) => ({
      type: "image",
      url: image.url,
      alt_text: product.title,
    })),
    variants: (product.variants ?? []).map((variant) => {
      const available = isVariantInStock(variant)
      return {
        id: variant.id,
        sku: variant.sku ?? undefined,
        title: variant.title ?? product.title,
        url: productUrl,
        availability: { available, status: available ? "in_stock" : "out_of_stock" },
        options: (variant.options ?? [])
          .map((value) => ({
            name: optionTitles.get(value.option_id ?? "") ?? "",
            value: value.value,
          }))
          .filter((option) => option.name !== "Default option"),
      }
    }),
  }
}

export const toUcpLineItems = (cart: HttpTypes.StoreCart) =>
  (cart.items ?? []).map((item) => ({
    id: item.id,
    item: {
      id: item.variant_id,
      title: Array.from(new Set([item.product_title, item.variant_title].filter(Boolean))).join(" - "),
    },
    quantity: item.quantity,
  }))

const MAX_LINE_ITEMS = 50
const MAX_QUANTITY = 10000

/** Validates a UCP `line_items` array into Medusa variant/quantity pairs. */
export const parseLineItems = (
  value: unknown
): { variant_id: string; quantity: number }[] | null => {
  if (!Array.isArray(value) || value.length > MAX_LINE_ITEMS) return null

  const items: { variant_id: string; quantity: number }[] = []
  for (const entry of value) {
    const id = entry?.item?.id
    const quantity = entry?.quantity
    if (
      typeof id !== "string" ||
      !id ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      return null
    }
    items.push({ variant_id: id, quantity })
  }
  return items
}

export const cartCountryCode = (cart: HttpTypes.StoreCart) =>
  (
    cart.shipping_address?.country_code ??
    cart.region?.countries?.[0]?.iso_2 ??
    ""
  ).toLowerCase()

export const cartContinueUrl = (origin: string, cart: HttpTypes.StoreCart) =>
  `${origin}/${cartCountryCode(cart)}/cart/resume/${cart.id}`
