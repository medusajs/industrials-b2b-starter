import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  DataTable,
  DataTablePaginationState,
  createDataTableColumnHelper,
  useDataTable,
  Badge,
  DropdownMenu,
  IconButton,
  Avatar,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useState, useMemo, useCallback } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { Buildings, EllipsisHorizontal, Trash, PencilSquare } from "@medusajs/icons"
import { Link } from "react-router-dom"

type SetupStep = {
  key: string
  label: string
  completed: boolean
}

type SetupStatus = {
  completed: boolean
  steps: SetupStep[]
  completed_count: number
  total_count: number
}

type Company = {
  id: string
  name: string
  email: string
  logo_url: string | null
  status: "pending" | "active" | "inactive" | "suspended"
  created_at: string
  country_code: string | null
  employees?: { id: string }[]
}

// Convert country code to flag emoji
const countryCodeToFlag = (countryCode: string | null) => {
  if (!countryCode) return null
  const code = countryCode.toUpperCase()
  return code
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("")
}

type CompaniesResponse = {
  companies: Company[]
  count: number
  limit: number
  offset: number
}

const columnHelper = createDataTableColumnHelper<Company>()

const statusColors: Record<
  Company["status"],
  "green" | "grey" | "orange" | "red"
> = {
  active: "green",
  pending: "orange",
  inactive: "grey",
  suspended: "red",
}

const SetupStatusCell = ({ companyId }: { companyId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["company-setup-status", companyId],
    queryFn: () =>
      sdk.client.fetch<{ setup_status: SetupStatus }>(
        `/admin/companies/${companyId}/setup-status`
      ),
  })

  if (isLoading) {
    return (
      <Text size="small" className="text-ui-fg-muted">
        ...
      </Text>
    )
  }

  if (!data) return null

  const { setup_status } = data

  return (
    <Badge
      color={setup_status.completed ? "green" : "orange"}
      size="2xsmall"
    >
      {setup_status.completed
        ? "Complete"
        : `${setup_status.completed_count}/${setup_status.total_count}`}
    </Badge>
  )
}

const ActionsCell = ({
  company,
  onDelete,
}: {
  company: Company
  onDelete: (id: string) => void
}) => {
  const prompt = usePrompt()

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: "Delete Company",
      description: `Are you sure you want to delete ${company.name}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (confirmed) {
      onDelete(company.id)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton size="small" variant="transparent">
          <EllipsisHorizontal />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item asChild>
          <Link to={`/companies/${company.id}/edit`}>
            <PencilSquare className="mr-2" />
            Edit
          </Link>
        </DropdownMenu.Item>
        <DropdownMenu.Item onClick={handleDelete} className="text-ui-fg-error">
          <Trash className="mr-2" />
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

const CompaniesPage = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 15,
    pageIndex: 0,
  })

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data, isLoading, refetch } = useQuery<CompaniesResponse>({
    queryFn: () =>
      sdk.client.fetch<CompaniesResponse>("/admin/companies", {
        query: {
          limit,
          offset,
        },
      }),
    queryKey: ["companies", limit, offset],
  })

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/companies/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      refetch()
      toast.success("Company deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete company")
    },
  })

  const handleDelete = useCallback((id: string) => {
    deleteCompanyMutation.mutate(id)
  }, [deleteCompanyMutation])

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Company",
        cell: ({ row }) => {
          const company = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar
                src={company.logo_url || undefined}
                fallback={company.name.charAt(0).toUpperCase()}
                size="small"
              />
              <Text size="small" weight="plus">
                {company.name}
              </Text>
            </div>
          )
        },
      }),
      columnHelper.accessor("created_at", {
        header: "Created At",
        cell: ({ getValue }) => {
          const date = new Date(getValue())
          return (
            <Text size="small" className="text-ui-fg-subtle">
              {date.toLocaleDateString()}
            </Text>
          )
        },
      }),
      columnHelper.accessor("employees", {
        header: "Employees",
        cell: ({ getValue }) => {
          const employees = getValue()
          return (
            <Text size="small" className="text-ui-fg-subtle">
              {employees?.length || 0}
            </Text>
          )
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue()
          return (
            <Badge color={statusColors[status]} size="2xsmall">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          )
        },
      }),
      columnHelper.display({
        id: "setup",
        header: "Setup",
        cell: ({ row }) => (
          <SetupStatusCell companyId={row.original.id} />
        ),
      }),
      columnHelper.accessor("country_code", {
        header: "Country",
        cell: ({ getValue }) => {
          const countryCode = getValue()
          const flag = countryCodeToFlag(countryCode)
          return (
            <Text size="small" className="text-xl">
              {flag || "-"}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ActionsCell company={row.original} onDelete={handleDelete} />
          </div>
        ),
        meta: {
          className: "text-right",
        },
      }),
    ],
    [deleteCompanyMutation.mutate]
  )

  const table = useDataTable({
    data: data?.companies || [],
    columns,
    getRowId: (company) => company.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Companies</Heading>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Companies",
  icon: Buildings,
})

export default CompaniesPage
