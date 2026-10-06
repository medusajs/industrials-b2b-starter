import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/utils/query-keys"
import { sdk } from "@/lib/utils/sdk"
import { reorder } from "@/lib/data/order"
import { useAuth } from "@/lib/hooks/use-auth"

interface OrderWithPlacedBy {
  id: string
  display_id?: number
  status?: string
  total?: number
  currency_code: string
  created_at?: string
  items?: any[]
  shipping_address?: any
  billing_address?: any
  shipping_methods?: any[]
  payment_collections?: any[]
  customer_id?: string
  placed_by?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    is_admin?: boolean
  }
}

export const useCustomerOrders = ({ fields }: { fields?: string } = {}) => {
  const { employee } = useAuth()
  const isAdmin = employee?.is_admin === true

  return useQuery({
    queryKey: [...queryKeys.customer.orders(), { isAdmin }],
    queryFn: async (): Promise<OrderWithPlacedBy[]> => {
      if (isAdmin) {
        // Admin: fetch all company orders
        const response = await sdk.client.fetch<{ orders: OrderWithPlacedBy[] }>(
          `/store/company/orders`,
          {
            method: "GET",
            query: { fields: fields || "+item_subtotal,+shipping_total,*items,*items.variant,*items.product,*shipping_address,*billing_address,*shipping_methods,*payment_collections" },
          }
        )
        return response.orders
      } else {
        // Regular employee: fetch only their orders
        const { orders } = await sdk.store.order.list({ fields })
        return orders as OrderWithPlacedBy[]
      }
    },
  })
}

export const useOrder = ({
  order_id,
  fields,
}: {
  order_id: string;
  fields?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(order_id),
    queryFn: async () => {
      const { order } = await sdk.store.order.retrieve(order_id, { fields })
      return order
    },
    enabled: !!order_id,
  })
}

export const usePayOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await sdk.client.fetch<{ order: any; payment: any }>(
        `/store/customers/me/orders/${orderId}/pay`,
        {
          method: "POST",
          body: {},
        }
      )
      return response
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customer.orders() })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
    },
  })
}

type AddressInput = {
  first_name?: string
  last_name?: string
  company?: string
  address_1?: string
  address_2?: string
  city?: string
  postal_code?: string
  province?: string
  country_code?: string
  phone?: string
}

export const useUpdateOrderAddress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      shipping_address,
      billing_address,
    }: {
      orderId: string
      shipping_address?: AddressInput
      billing_address?: AddressInput
    }) => {
      const response = await sdk.client.fetch<{ order: any }>(
        `/store/customers/me/orders/${orderId}/address`,
        {
          method: "POST",
          body: { shipping_address, billing_address },
        }
      )
      return response
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
    },
  })
}

export const useOrderShippingOptions = ({ orderId }: { orderId: string }) => {
  return useQuery({
    queryKey: ["order-shipping-options", orderId],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ shipping_options: any[] }>(
        `/store/customers/me/orders/${orderId}/shipping-options`,
        { method: "GET" }
      )
      return response.shipping_options
    },
    enabled: !!orderId,
  })
}

export const useSetOrderShippingMethod = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      shipping_option_id,
    }: {
      orderId: string
      shipping_option_id: string
    }) => {
      const response = await sdk.client.fetch<{ order: any }>(
        `/store/customers/me/orders/${orderId}/shipping-method`,
        {
          method: "POST",
          body: { shipping_option_id },
        }
      )
      return response
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
    },
  })
}

export const useInitOrderPaymentSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      provider_id,
    }: {
      orderId: string
      provider_id: string
    }) => {
      const response = await sdk.client.fetch<{ payment_collection: any }>(
        `/store/customers/me/orders/${orderId}/payment-session`,
        {
          method: "POST",
          body: { provider_id },
        }
      )
      return response
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
    },
  })
}

/**
 * Hook to reorder a previous order by creating a new cart with the same items,
 * addresses, and shipping method.
 * 
 * On success, invalidates the cart query so UI updates to show new cart.
 */
export const useReorder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const cart = await reorder({ order_id: orderId })
      return cart
    },
    onSuccess: () => {
      // Invalidate cart query so UI updates to show new cart
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
    },
  })
}
