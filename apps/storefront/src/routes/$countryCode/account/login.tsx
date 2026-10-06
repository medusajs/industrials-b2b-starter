import { createFileRoute, redirect } from "@tanstack/react-router"
import LoginPage from "@/pages/login"
import { sdk } from "@/lib/utils/sdk"

export const Route = createFileRoute("/$countryCode/account/login")({
  beforeLoad: async () => {
    // Check if already authenticated, redirect to home
    try {
      await sdk.store.customer.retrieve()
      // If successful, user is already logged in
      throw redirect({ to: "/$countryCode", params: { countryCode: "us" } })
    } catch (error: any) {
      // Re-throw redirect
      if (error?.to) throw error
      // Unauthorized errors are expected for login page - ignore them
      // Any other errors we also silently ignore to allow showing login page
    }
  },
  head: () => ({
    meta: [
      { title: "Sign In | ProLift Equipment" },
      { name: "description", content: "Sign in to your ProLift Equipment account to view pricing, place orders, and manage your equipment." },
    ],
  }),
  component: LoginPage,
})
