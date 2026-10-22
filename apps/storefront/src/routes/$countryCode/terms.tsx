import { createFileRoute } from "@tanstack/react-router"
import { STORE_NAME } from "@/lib/utils/site"
import Terms from "@/pages/terms"

export const Route = createFileRoute("/$countryCode/terms")({
  head: () => ({ meta: [{ title: `Terms of Service | ${STORE_NAME}` }] }),
  component: Terms,
})
