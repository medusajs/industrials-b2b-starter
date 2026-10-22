import { createFileRoute } from "@tanstack/react-router"
import { getStorePolicies } from "@/lib/data/store-policies"
import { STORE_NAME } from "@/lib/utils/site"
import Returns from "@/pages/returns"

export const Route = createFileRoute("/$countryCode/returns")({
  loader: ({ params }) => getStorePolicies(params.countryCode),
  head: () => ({ meta: [{ title: `Return Policy | ${STORE_NAME}` }] }),
  component: Returns,
})
