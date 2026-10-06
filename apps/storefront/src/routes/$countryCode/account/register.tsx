import { createFileRoute } from "@tanstack/react-router"
import RegisterPage from "@/pages/register"

export const Route = createFileRoute("/$countryCode/account/register")({
  component: RegisterPage,
})
