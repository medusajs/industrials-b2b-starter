import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import OrdersPage from "@/pages/orders"

const ordersSearchSchema = z.object({
  orderId: z.string().optional(),
})

export const Route = createFileRoute("/$countryCode/orders")({
  component: OrdersPage,
  validateSearch: ordersSearchSchema,
  head: () => {
    return {
      meta: [
        {
          title: "Order History | ProLift Equipment Portal",
        },
        {
          name: "description",
          content: "View and manage your order history.",
        },
      ],
    }
  },
})
