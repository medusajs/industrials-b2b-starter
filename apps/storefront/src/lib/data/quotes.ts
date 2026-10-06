import { sdk } from "@/lib/utils/sdk"

export interface Quote {
  id: string
  status:
    | "pending_merchant"
    | "pending_customer"
    | "accepted"
    | "customer_rejected"
    | "merchant_rejected"
  customer_id: string
  draft_order_id: string
  order_change_id: string
  cart_id: string
  created_at: string
  updated_at: string
  cart?: {
    id: string
    total: number
    items: Array<{
      id: string
      title: string
      unit_price: number
      quantity: number
      total: number
      variant_id?: string
    }>
  }
  draft_order?: {
    id: string
    display_id: number
    status: string
    currency_code: string
    total: number
    subtotal: number
    items: Array<{
      id: string
      title: string
      quantity: number
      unit_price: number
      total: number
      thumbnail?: string
      variant?: {
        id: string
        title: string
        sku?: string
      }
    }>
  }
  customer?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  order_preview?: {
    items: Array<{
      id: string
      title: string
      quantity: number
      unit_price: number
      total: number
      actions?: Array<{ action: string }>
    }>
    total: number
    summary: {
      current_order_total: number
    }
  }
}

export interface CreateQuoteInput {
  cart_id: string
}

export async function getQuotes(): Promise<{ quotes: Quote[] }> {
  return await sdk.client.fetch<{ quotes: Quote[] }>(
    "/store/customers/me/quotes",
    {
      method: "GET",
    }
  )
}

export async function getQuote(id: string): Promise<{ quote: Quote }> {
  return await sdk.client.fetch<{ quote: Quote }>(
    `/store/customers/me/quotes/${id}`,
    {
      method: "GET",
    }
  )
}

export async function getQuotePreview(id: string): Promise<{ quote: Quote }> {
  return await sdk.client.fetch<{ quote: Quote }>(
    `/store/customers/me/quotes/${id}/preview`,
    {
      method: "GET",
    }
  )
}

export async function createQuote(
  input: CreateQuoteInput
): Promise<{ quote: Quote }> {
  return await sdk.client.fetch<{ quote: Quote }>(
    "/store/customers/me/quotes",
    {
      method: "POST",
      body: input,
    }
  )
}

export async function rejectQuote(id: string): Promise<{ quote: Quote }> {
  return await sdk.client.fetch<{ quote: Quote }>(
    `/store/customers/me/quotes/${id}/reject`,
    {
      method: "POST",
    }
  )
}

export async function acceptQuote(id: string): Promise<{ quote: Quote }> {
  return await sdk.client.fetch<{ quote: Quote }>(
    `/store/customers/me/quotes/${id}/accept`,
    {
      method: "POST",
    }
  )
}

// Legacy function for backward compatibility
export async function createQuoteFromCart(input: {
  cart_id: string
}): Promise<{ quote: Quote }> {
  return createQuote(input)
}
