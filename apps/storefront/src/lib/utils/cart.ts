import { HttpTypes } from "@medusajs/types"
import { QueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/utils/query-keys"

// ============ STORED CART ============

export const CART_KEY = "medusa_cart"

const readCartCookie = (): string | undefined => {
  if (typeof document === "undefined") return undefined
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CART_KEY}=`))
    ?.split("=")[1] || undefined
}

// Mirrored to a cookie so server routes (add-to-cart form, /buy permalinks, UCP) share the same cart.
export const getStoredCart = (): string | undefined => {
  const fromCookie = readCartCookie()
  const fromStorage = localStorage.getItem(CART_KEY) || undefined
  if (fromCookie && fromCookie !== fromStorage) {
    localStorage.setItem(CART_KEY, fromCookie)
  }
  return fromCookie || fromStorage
}

export const setStoredCart = (cart: string): void => {
  localStorage.setItem(CART_KEY, cart)
  document.cookie = `${CART_KEY}=${cart}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
}

export const removeStoredCart = (): void => {
  localStorage.removeItem(CART_KEY)
  document.cookie = `${CART_KEY}=; path=/; max-age=0; SameSite=Lax`
}

// ============ SORT CART ITEMS ============

export const sortCartItems = (items: HttpTypes.StoreCartLineItem[]): HttpTypes.StoreCartLineItem[] => {
  return items.sort((a, b) => {
    if (!a.created_at || !b.created_at) {
      return 0
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

// ============ OPTIMISTIC CART ============

export interface OptimisticCartItem {
  id: string;
  variant_id: string;
  quantity: number;
  title: string;
  thumbnail?: string | null;
  product_title?: string;
  variant_title?: string;
  product?: {
    id: string;
    title: string;
  };
  variant?: {
    id: string;
    title: string;
  };
  unit_price: number;
  total: number;
  isOptimistic?: boolean;
}

export interface OptimisticCart extends HttpTypes.StoreCart {
  isOptimistic?: boolean;
}

export const createOptimisticCartItem = (
  variant: HttpTypes.StoreProductVariant,
  product: HttpTypes.StoreProduct,
  quantity: number = 1
): OptimisticCartItem => {
  const unitPrice = variant.calculated_price?.calculated_amount || 0

  return {
    id: `optimistic-${variant.id}-${Date.now()}`,
    variant_id: variant.id,
    quantity,
    title: product.title,
    thumbnail: product.thumbnail,
    product: {
      id: product.id,
      title: product.title,
    },
    product_title: product.title,
    variant: {
      id: variant.id,
      title: variant.title || "Default Variant",
    },
    variant_title: variant.title || "Default Variant",
    unit_price: unitPrice,
    total: unitPrice * quantity,
    isOptimistic: true,
  }
}

export const addItemOptimistically = (
  queryClient: QueryClient,
  newItem: OptimisticCartItem,
  optimisticCart?: OptimisticCart,
  fields?: string
): HttpTypes.StoreCart | null => {
  const currentCart = optimisticCart || queryClient.getQueryData<HttpTypes.StoreCart | null>(
    queryKeys.cart.current(fields)
  )

  if (!currentCart) {
    return null
  }

  const existingItemIndex = currentCart.items?.findIndex(
    item => item.variant_id === newItem.variant_id
  )

  let updatedItems: HttpTypes.StoreCartLineItem[]

  if (existingItemIndex !== undefined && existingItemIndex >= 0) {
    updatedItems = [...(currentCart.items || [])]
    const existingItem = updatedItems[existingItemIndex]
    updatedItems[existingItemIndex] = {
      ...existingItem,
      quantity: existingItem.quantity + newItem.quantity,
      total: (existingItem.unit_price || 0) * (existingItem.quantity + newItem.quantity),
    }
  } else {
    const optimisticLineItem = {
      ...newItem,
      cart_id: currentCart.id,
      cart: currentCart,
      item_total: newItem.total,
      item_subtotal: newItem.total,
      item_tax_total: 0,
      original_total: newItem.total,
      original_tax_total: 0,
      original_subtotal: newItem.total,
      discount_total: 0,
      discount_tax_total: 0,
      gift_card_total: 0,
      subtotal: newItem.total,
      tax_total: 0,
      total: newItem.total,
      created_at: new Date(),
      updated_at: new Date(),
      metadata: {},
      adjustments: [],
      tax_lines: [],
      unit_tax_amount: 0,
      requires_shipping: true,
      is_discountable: true,
      is_tax_inclusive: false,
    } as HttpTypes.StoreCartLineItem

    updatedItems = [...(currentCart.items || []), optimisticLineItem]
  }

  const newItemSubtotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0)

  const newOptimisticCart: OptimisticCart = {
    ...currentCart,
    items: updatedItems,
    item_subtotal: newItemSubtotal,
    isOptimistic: true,
  }

  queryClient.setQueryData(queryKeys.cart.current(fields), newOptimisticCart)

  return newOptimisticCart
}

export const updateLineItemOptimistically = (
  queryClient: QueryClient,
  lineId: string,
  quantity: number,
  fields?: string
): HttpTypes.StoreCart | null => {
  const currentCart = queryClient.getQueryData<HttpTypes.StoreCart | null>(
    queryKeys.cart.current(fields)
  )

  if (!currentCart) {
    return null
  }

  const updatedItems = (currentCart.items || []).map(item => {
    if (item.id === lineId) {
      return {
        ...item,
        quantity,
        total: (item.unit_price || 0) * quantity,
        original_total: (item.unit_price || 0) * quantity,
      }
    }
    return item
  })

  const optimisticCart: OptimisticCart = {
    ...currentCart,
    items: updatedItems,
    item_subtotal: updatedItems.reduce((sum, item) => sum + (item.total || 0), 0),
    isOptimistic: true,
  }

  queryClient.setQueryData(queryKeys.cart.current(fields), optimisticCart)

  return optimisticCart
}

export const removeLineItemOptimistically = (
  queryClient: QueryClient,
  lineId: string,
  fields?: string
): HttpTypes.StoreCart | null => {
  const currentCart = queryClient.getQueryData<HttpTypes.StoreCart | null>(
    queryKeys.cart.current(fields)
  )

  if (!currentCart) {
    return null
  }

  const updatedItems = (currentCart.items || []).filter(item => item.id !== lineId)

  const optimisticCart: OptimisticCart = {
    ...currentCart,
    items: updatedItems,
    item_subtotal: updatedItems.reduce((sum, item) => sum + (item.total || 0), 0),
    isOptimistic: true,
  }

  queryClient.setQueryData(queryKeys.cart.current(fields), optimisticCart)

  return optimisticCart
}

export const rollbackOptimisticCart = (
  queryClient: QueryClient,
  previousCart: HttpTypes.StoreCart | null,
  fields?: string
) => {
  queryClient.setQueryData(queryKeys.cart.current(fields), previousCart)
}

export const createOptimisticCart = (region: HttpTypes.StoreRegion): OptimisticCart => {
  const tempId = `optimistic-cart-${Date.now()}`

  return {
    id: tempId,
    region_id: region.id,
    items: [],
    item_subtotal: 0,
    item_tax_total: 0,
    item_total: 0,
    original_item_total: 0,
    original_item_tax_total: 0,
    original_item_subtotal: 0,
    original_total: 0,
    original_tax_total: 0,
    original_subtotal: 0,
    subtotal: 0,
    tax_total: 0,
    total: 0,
    discount_total: 0,
    discount_tax_total: 0,
    gift_card_total: 0,
    gift_card_tax_total: 0,
    shipping_total: 0,
    shipping_tax_total: 0,
    shipping_subtotal: 0,
    original_shipping_total: 0,
    original_shipping_subtotal: 0,
    original_shipping_tax_total: 0,
    shipping_address: undefined,
    billing_address: undefined,
    shipping_methods: [],
    payment_collection: undefined,
    region: undefined,
    customer_id: undefined,
    sales_channel_id: undefined,
    promotions: [],
    currency_code: region.currency_code,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    isOptimistic: true,
  }
}

export const getCurrentCart = (queryClient: QueryClient, fields?: string): HttpTypes.StoreCart | null => {
  return queryClient.getQueryData<HttpTypes.StoreCart | null>(queryKeys.cart.current(fields)) ||
    queryClient.getQueriesData<HttpTypes.StoreCart | null>({
      predicate: queryKeys.cart.predicate
    })[0]?.[1] || null
}
