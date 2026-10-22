import { createFileRoute } from "@tanstack/react-router"
import { STORE_NAME } from "@/lib/utils/site"
import Contact from "@/pages/contact"

export const Route = createFileRoute("/$countryCode/contact")({
  head: () => ({ meta: [{ title: `Contact Us | ${STORE_NAME}` }] }),
  component: Contact,
})
