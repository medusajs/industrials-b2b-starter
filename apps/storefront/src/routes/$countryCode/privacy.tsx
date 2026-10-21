import { createFileRoute } from "@tanstack/react-router"
import { STORE_NAME } from "@/lib/utils/site"
import Privacy from "@/pages/privacy"

export const Route = createFileRoute("/$countryCode/privacy")({
  head: () => ({ meta: [{ title: `Privacy Policy | ${STORE_NAME}` }] }),
  component: Privacy,
})
