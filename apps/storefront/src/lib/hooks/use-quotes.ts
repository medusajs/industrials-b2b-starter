import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/utils/query-keys"
import {
  getQuotes,
  getQuote,
  getQuotePreview,
  createQuote,
  acceptQuote,
  rejectQuote,
  type CreateQuoteInput,
  type Quote,
} from "@/lib/data/quotes"
import { useAuth } from "@/lib/hooks/use-auth"
import { sdk } from "@/lib/utils/sdk"

export interface QuoteWithRequestedBy extends Quote {
  requested_by?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    is_admin?: boolean
  }
}

export function useQuotes() {
  const { employee } = useAuth()
  const isAdmin = employee?.is_admin === true

  return useQuery({
    queryKey: [...queryKeys.quotes.list(), { isAdmin }],
    queryFn: async (): Promise<QuoteWithRequestedBy[]> => {
      if (isAdmin) {
        // Admin: fetch all company quotes
        const response = await sdk.client.fetch<{ quotes: QuoteWithRequestedBy[] }>(
          `/store/company/quotes`,
          { method: "GET" }
        )
        return response.quotes
      } else {
        // Regular employee: fetch only their quotes
        const { quotes } = await getQuotes()
        return quotes
      }
    },
  })
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: queryKeys.quotes.detail(id),
    queryFn: async () => {
      const { quote } = await getQuote(id)
      return quote
    },
    enabled: !!id,
  })
}

export function useQuotePreview(id: string) {
  return useQuery({
    queryKey: [...queryKeys.quotes.detail(id), "preview"],
    queryFn: async () => {
      const { quote } = await getQuotePreview(id)
      return quote
    },
    enabled: !!id,
  })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateQuoteInput) => {
      const { quote } = await createQuote(input)
      return quote
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all })
    },
  })
}

export function useAcceptQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { quote } = await acceptQuote(id)
      return quote
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotes.detail(id),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.customer.orders() })
    },
  })
}

export function useRejectQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { quote } = await rejectQuote(id)
      return quote
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotes.detail(id),
      })
    },
  })
}

// Legacy function for backward compatibility with cart page
export function useCreateQuoteFromCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { cart_id: string }) => {
      const { quote } = await createQuote(input)
      return quote
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all })
      queryClient.invalidateQueries({ predicate: queryKeys.cart.predicate })
    },
  })
}
