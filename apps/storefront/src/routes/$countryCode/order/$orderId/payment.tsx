import { createFileRoute } from "@tanstack/react-router"
import OrderPaymentPage from "@/pages/order-payment"

export const Route = createFileRoute("/$countryCode/order/$orderId/payment")({
  component: OrderPaymentPage,
  head: () => {
    return {
      meta: [
        {
          title: "Order Payment | ProLift Equipment Portal",
        },
        {
          name: "description",
          content: "Complete payment for your order.",
        },
      ],
    }
  },
})
