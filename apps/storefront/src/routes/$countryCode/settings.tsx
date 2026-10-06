import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import SettingsPage from "@/pages/settings"

const settingsSearchSchema = z.object({
  tab: z.string().optional(),
})

export const Route = createFileRoute("/$countryCode/settings")({
  validateSearch: settingsSearchSchema,
  component: SettingsPage,
  head: () => {
    return {
      meta: [
        {
          title: "Settings | ProLift Equipment Portal",
        },
        {
          name: "description",
          content: "Manage your profile and account settings.",
        },
      ],
    }
  },
})
