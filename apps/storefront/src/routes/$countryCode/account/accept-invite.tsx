import { createFileRoute, redirect } from "@tanstack/react-router"
import AcceptInvitePage from "@/pages/accept-invite"
import { sdk } from "@/lib/utils/sdk"

export const Route = createFileRoute("/$countryCode/account/accept-invite")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: typeof search.token === "string" ? search.token : undefined,
    }
  },
  beforeLoad: async () => {
    // Check if already authenticated, redirect to home
    try {
      await sdk.store.customer.retrieve()
      // If successful, user is already logged in
      throw redirect({ to: "/$countryCode", params: { countryCode: "us" } })
    } catch (error: any) {
      // Re-throw redirect
      if (error?.to) throw error
      // Unauthorized errors are expected - ignore them
    }
  },
  head: () => ({
    meta: [
      { title: "Accept Invite | ProLift Equipment" },
      { name: "description", content: "Accept your team invitation and create your account." },
    ],
  }),
  component: AcceptInvitePage,
})
