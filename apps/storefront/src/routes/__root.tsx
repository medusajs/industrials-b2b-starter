import Layout from "@/components/layout"
import { listRegions } from "@/lib/data/regions"
import { CartProvider } from "@/lib/context/cart"
import { AuthProvider } from "@/lib/context/auth-context"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { lazy } from "react"
import { Toaster } from "sonner"
import appCss from "../styles/app.css?url"

const NotFound = lazy(() => import("@/components/not-found"))

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  loader: async ({ context }) => {
    const { queryClient } = context
    
    // Pre-populate regions cache
    await queryClient.ensureQueryData({
      queryKey: ["regions"],
      queryFn: () => listRegions({ fields: "id, name, currency_code, *countries" }),
    })
    
    return {}
  },
  head: () => ({
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/images/prolift-favicon.svg" },
      { rel: "shortcut icon", href: "/images/prolift-favicon.svg" },
      { rel: "apple-touch-icon", href: "/images/prolift-favicon.svg" },
      { rel: "stylesheet", href: appCss },
    ],
    meta: [
      { title: "ProLift Equipment" },
      { charSet: "UTF-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0",
      },
    ],
    scripts: [],
  }),
  notFoundComponent: NotFound,
  component: RootComponent,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <Layout />
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
        <Toaster position="bottom-right" richColors />

        <Scripts />
      </body>
    </html>
  )
}
