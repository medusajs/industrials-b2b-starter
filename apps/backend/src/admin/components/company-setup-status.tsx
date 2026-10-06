import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/client"
import { Badge, Text } from "@medusajs/ui"
import { CheckCircleSolid, XCircleSolid } from "@medusajs/icons"

interface SetupStep {
  key: string
  label: string
  completed: boolean
}

interface SetupStatusResponse {
  setup_status: {
    completed: boolean
    steps: SetupStep[]
    completed_count: number
    total_count: number
  }
}

export function CompanySetupStatus({ companyId }: { companyId: string }) {
  const { data, isLoading } = useQuery<SetupStatusResponse>({
    queryKey: ["company-setup-status", companyId],
    queryFn: () =>
      sdk.client.fetch<SetupStatusResponse>(
        `/admin/companies/${companyId}/setup-status`
      ),
    enabled: !!companyId,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-3">
        <Text size="small" weight="plus" leading="compact">
          Setup Status
        </Text>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-ui-bg-subtle rounded w-3/4" />
          <div className="h-4 bg-ui-bg-subtle rounded w-1/2" />
          <div className="h-4 bg-ui-bg-subtle rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!data?.setup_status) return null

  const { setup_status } = data

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <Text size="small" weight="plus" leading="compact">
          Setup Status
        </Text>
        <Badge
          size="2xsmall"
          color={setup_status.completed ? "green" : "orange"}
        >
          {setup_status.completed
            ? "Complete"
            : `${setup_status.completed_count}/${setup_status.total_count}`}
        </Badge>
      </div>

      <div className="space-y-2">
        {setup_status.steps.map((step) => (
          <div key={step.key} className="flex items-center gap-x-2">
            {step.completed ? (
              <CheckCircleSolid className="text-ui-fg-interactive w-4 h-4" />
            ) : (
              <XCircleSolid className="text-ui-fg-muted w-4 h-4" />
            )}
            <Text
              size="small"
              leading="compact"
              className={
                step.completed ? "text-ui-fg-subtle" : "text-ui-fg-base"
              }
            >
              {step.label}
            </Text>
          </div>
        ))}
      </div>
    </div>
  )
}
