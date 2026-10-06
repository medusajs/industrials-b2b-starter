import { createFileRoute } from "@tanstack/react-router"
import QuotesPage from "@/pages/quotes"

export const Route = createFileRoute("/$countryCode/quotes")({
  component: QuotesPage,
  head: () => {
    return {
      meta: [
        {
          title: "Quotes | ProLift Equipment Portal",
        },
        {
          name: "description",
          content: "View and manage your price quote requests.",
        },
      ],
    }
  },
})
