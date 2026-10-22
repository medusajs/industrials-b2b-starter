import Home from "@/pages/home"
import { buildHomeHead, HOME_HEADERS, loadHome } from "@/lib/data/home"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/$countryCode/")({
  loader: ({ params, context }) => loadHome(params.countryCode, context.queryClient),
  headers: () => HOME_HEADERS,
  head: ({ loaderData }) => buildHomeHead(loaderData),
  component: Home,
})
