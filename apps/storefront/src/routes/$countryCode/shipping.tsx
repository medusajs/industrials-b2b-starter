import { createFileRoute } from "@tanstack/react-router"
import { getStorePolicies } from "@/lib/data/store-policies"
import { STORE_NAME } from "@/lib/utils/site"
import Shipping from "@/pages/shipping"

export const Route = createFileRoute("/$countryCode/shipping")({
  loader: ({ params }) => getStorePolicies(params.countryCode),
  head: () => ({ meta: [{ title: `Shipping Information | ${STORE_NAME}` }] }),
  component: Shipping,
})
