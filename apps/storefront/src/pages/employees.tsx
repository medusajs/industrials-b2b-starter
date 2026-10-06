import { useState, useEffect } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useAuth } from "@/lib/hooks/use-auth"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getEmployees, updateEmployeeSpendingLimit, inviteEmployee, getEmployeeInvites, getEmployeeInvitesCount, resendEmployeeInvite, EmployeeListItem, EmployeeInvite } from "@/lib/data/me"
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu"
import { PencilSquare, ChevronUpMini, ChevronDownMini, ArrowLeftMini, ArrowRightMini, XMark, CheckMini, MagnifyingGlassMini, Plus, EnvelopeSolid, Clock, Users, ArrowPath, SquareTwoStack } from "@medusajs/icons"
import { toast } from "sonner"
import { DashboardPageLayout } from "@/components/dashboard-page-layout"

type Tab = "employees" | "invites"

type SortField = "name" | "email" | "spending_limit"
type SortOrder = "asc" | "desc"

function formatCurrency(amount: number | null): string {
  if (amount === null) return "Unlimited"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function SortIcon({ field, currentField, order }: { field: SortField; currentField: SortField; order: SortOrder }) {
  if (field !== currentField) {
    return (
      <span className="ml-1 text-gray-300">
        <ChevronUpMini className="w-3 h-3 -mb-1" />
        <ChevronDownMini className="w-3 h-3 -mt-1" />
      </span>
    )
  }
  return order === "asc" ? (
    <ChevronUpMini className="w-4 h-4 ml-1 inline" />
  ) : (
    <ChevronDownMini className="w-4 h-4 ml-1 inline" />
  )
}

interface EditModalProps {
  employee: EmployeeListItem
  onClose: () => void
  onSave: (employeeId: string, spendingLimit: number | null) => void
  isSaving: boolean
}

function EditSpendingLimitModal({ employee, onClose, onSave, isSaving }: EditModalProps) {
  const [isUnlimited, setIsUnlimited] = useState(employee.spending_limit === null)
  const [limitValue, setLimitValue] = useState(
    employee.spending_limit !== null ? String(employee.spending_limit) : ""
  )

  const handleSave = () => {
    const newLimit = isUnlimited ? null : Number(limitValue)
    onSave(employee.id, newLimit)
  }

  const employeeName = employee.customer.first_name && employee.customer.last_name
    ? `${employee.customer.first_name} ${employee.customer.last_name}`
    : employee.customer.email

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Spending Limit</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Employee</p>
            <p className="font-medium text-gray-900">{employeeName}</p>
            <p className="text-sm text-gray-500">{employee.customer.email}</p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isUnlimited}
                onChange={(e) => setIsUnlimited(e.target.checked)}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">Unlimited spending</span>
            </label>

            {!isUnlimited && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spending Limit (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={limitValue}
                    onChange={(e) => setLimitValue(e.target.value)}
                    min="0"
                    step="100"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave at 0 to prevent any purchases
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (!isUnlimited && limitValue === "")}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckMini className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

interface InviteModalProps {
  onClose: () => void
  onInvite: (email: string, spendingLimit: number | null, isAdmin: boolean) => void
  isInviting: boolean
  error: string | null
}

function InviteEmployeeModal({ onClose, onInvite, isInviting, error }: InviteModalProps) {
  const [email, setEmail] = useState("")
  const [isUnlimited, setIsUnlimited] = useState(true)
  const [limitValue, setLimitValue] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const spendingLimit = isUnlimited ? null : Number(limitValue)
    onInvite(email, spendingLimit, isAdmin)
  }

  const isValid = email.trim() !== "" && (isUnlimited || limitValue !== "")

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Invite Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMark className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="employee@company.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                An invite link will be sent to this email
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUnlimited}
                  onChange={(e) => setIsUnlimited(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">Unlimited spending</span>
              </label>

              {!isUnlimited && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spending Limit (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={limitValue}
                      onChange={(e) => setLimitValue(e.target.value)}
                      min="0"
                      step="100"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Make admin</span>
                <p className="text-xs text-gray-500">Admins can manage employees and have unlimited spending</p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInviting || !isValid}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isInviting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <EnvelopeSolid className="w-4 h-4" />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function InvitesTab({ invites, isLoading, onResend, resendingId, companyName }: { 
  invites: EmployeeInvite[]
  isLoading: boolean
  onResend: (inviteId: string) => void
  resendingId: string | null
  companyName: string
}) {
  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Created</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Expires</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 3 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                      <div className="h-4 w-40 bg-gray-200 rounded" />
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded-full" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded-full" /></td>
                  <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (invites.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <EnvelopeSolid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invites</h3>
        <p className="text-gray-500">When you invite employees, their pending invites will appear here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Email</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Role</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Created</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Expires</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invites.map((invite) => {
              const expired = isExpired(invite.expires_at)
              const isResending = resendingId === invite.id

              const actionItems: ActionMenuItem[] = [
                {
                  label: "Resend Invite",
                  icon: ArrowPath,
                  onClick: () => onResend(invite.id),
                  disabled: isResending,
                  loading: isResending,
                },
                {
                  label: "Copy Invite Params",
                  icon: SquareTwoStack,
                  onClick: () => {
                    try {
                      const params = `token=${encodeURIComponent(invite.token)}&email=${encodeURIComponent(invite.email)}&company=${encodeURIComponent(companyName)}`
                      const textarea = document.createElement("textarea")
                      textarea.value = params
                      textarea.style.position = "fixed"
                      textarea.style.opacity = "0"
                      document.body.appendChild(textarea)
                      textarea.select()
                      document.execCommand("copy")
                      document.body.removeChild(textarea)
                      toast.success("Invite params copied to clipboard")
                    } catch {
                      toast.error("Failed to copy invite params")
                    }
                  },
                },
              ]

              return (
                <tr key={invite.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center">
                        <EnvelopeSolid className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-900">{invite.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      invite.is_admin 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {invite.is_admin ? "Admin" : "Employee"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(invite.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(invite.expires_at)}
                  </td>
                  <td className="px-6 py-4">
                    {expired ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end">
                      <ActionMenu items={actionItems} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function EmployeesPage() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"
  const navigate = useNavigate()
  const { isAdmin, isLoading: authLoading, employee } = useAuth()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>("employees")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [editingEmployee, setEditingEmployee] = useState<EmployeeListItem | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const limit = 15

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate({ to: `/${countryCode}` })
    }
  }, [authLoading, isAdmin, navigate, countryCode])

  const { data, isLoading, error } = useQuery({
    queryKey: ["employees", page, limit, debouncedSearch, sortBy, sortOrder],
    queryFn: () => getEmployees({
      page,
      limit,
      search: debouncedSearch,
      sortBy,
      sortOrder,
    }),
    enabled: isAdmin,
  })

  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ["employee-invites"],
    queryFn: getEmployeeInvites,
    enabled: isAdmin && activeTab === "invites",
  })

  // Fetch invite count for badge display (runs on page load, not just when tab is active)
  const { data: invitesCountData } = useQuery({
    queryKey: ["employee-invites-count"],
    queryFn: getEmployeeInvitesCount,
    enabled: isAdmin,
  })

  const updateMutation = useMutation({
    mutationFn: ({ employeeId, spendingLimit }: { employeeId: string; spendingLimit: number | null }) =>
      updateEmployeeSpendingLimit(employeeId, spendingLimit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      setEditingEmployee(null)
    },
  })

  const inviteMutation = useMutation({
    mutationFn: ({ email, spendingLimit, isAdmin }: { email: string; spendingLimit: number | null; isAdmin: boolean }) =>
      inviteEmployee({ email, spending_limit: spendingLimit, is_admin: isAdmin }),
    onSuccess: () => {
      setShowInviteModal(false)
      setInviteError(null)
      queryClient.invalidateQueries({ queryKey: ["employee-invites"] })
      queryClient.invalidateQueries({ queryKey: ["employee-invites-count"] })
      toast.success("Invite sent successfully")
    },
    onError: (error: any) => {
      setInviteError(error?.message || "Failed to send invite. Please try again.")
    },
  })

  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null)

  const resendMutation = useMutation({
    mutationFn: (inviteId: string) => resendEmployeeInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-invites"] })
      setResendingInviteId(null)
      toast.success("Invite resent successfully")
    },
    onError: () => {
      setResendingInviteId(null)
      toast.error("Failed to resend invite")
    },
  })

  const handleResendInvite = (inviteId: string) => {
    setResendingInviteId(inviteId)
    resendMutation.mutate(inviteId)
  }

  const handleInvite = (email: string, spendingLimit: number | null, isAdmin: boolean) => {
    setInviteError(null)
    inviteMutation.mutate({ email, spendingLimit, isAdmin })
  }

  const handleSort = (field: SortField) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
    setPage(1)
  }

  const handleSaveSpendingLimit = (employeeId: string, spendingLimit: number | null) => {
    updateMutation.mutate({ employeeId, spendingLimit })
  }

  if (authLoading) {
    return (
      <DashboardPageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
        </div>
      </DashboardPageLayout>
    )
  }

  if (!isAdmin) {
    return null
  }

  const employees = data?.employees || []
  const totalPages = data?.pageCount || 1

  return (
    <DashboardPageLayout>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Employees</h1>
          <p className="text-gray-600">Manage your company's employee accounts and spending limits.</p>
        </div>
        <button
          onClick={() => {
            setInviteError(null)
            setShowInviteModal(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Invite Employee
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("employees")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "employees"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          Employees
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "invites"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <EnvelopeSolid className="w-4 h-4" />
          Invites
          {(invitesCountData?.count ?? 0) > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              {invitesCountData?.count}
            </span>
          )}
        </button>
      </div>

      {/* Invites Tab Content */}
      {activeTab === "invites" && (
        <InvitesTab
          invites={invitesData?.invites || []}
          isLoading={invitesLoading}
          onResend={handleResendInvite}
          resendingId={resendingInviteId}
          companyName={employee?.company?.name || ""}
        />
      )}

      {/* Employees Tab Content */}
      {activeTab === "employees" && (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <MagnifyingGlassMini className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center text-sm font-semibold text-gray-900 hover:text-gray-700"
                  >
                    Name
                    <SortIcon field="name" currentField={sortBy} order={sortOrder} />
                  </button>
                </th>
                <th className="text-left px-6 py-4">
                  <button
                    onClick={() => handleSort("email")}
                    className="flex items-center text-sm font-semibold text-gray-900 hover:text-gray-700"
                  >
                    Email
                    <SortIcon field="email" currentField={sortBy} order={sortOrder} />
                  </button>
                </th>
                <th className="text-left px-6 py-4">
                  <button
                    onClick={() => handleSort("spending_limit")}
                    className="flex items-center text-sm font-semibold text-gray-900 hover:text-gray-700"
                  >
                    Spending Limit
                    <SortIcon field="spending_limit" currentField={sortBy} order={sortOrder} />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                  Role
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                        <div className="h-4 w-28 bg-gray-200 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 bg-gray-200 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 bg-gray-200 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-600">
                    Error loading employees. Please try again.
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {search ? "No employees found matching your search." : "No employees found."}
                  </td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const name = employee.customer.first_name && employee.customer.last_name
                    ? `${employee.customer.first_name} ${employee.customer.last_name}`
                    : "-"
                  const initials = employee.customer.first_name && employee.customer.last_name
                    ? `${employee.customer.first_name[0]}${employee.customer.last_name[0]}`.toUpperCase()
                    : employee.customer.email[0].toUpperCase()

                  const actionItems: ActionMenuItem[] = !employee.is_admin ? [
                    {
                      label: "Edit Spending Limit",
                      icon: PencilSquare,
                      onClick: () => setEditingEmployee(employee),
                    },
                  ] : []

                  return (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center font-medium text-sm">
                            {initials}
                          </div>
                          <span className="font-medium text-gray-900">{name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {employee.customer.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${employee.spending_limit === null ? "text-teal-600" : "text-gray-900"}`}>
                          {formatCurrency(employee.spending_limit)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          employee.is_admin 
                            ? "bg-purple-100 text-purple-700" 
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {employee.is_admin ? "Admin" : "Employee"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                          {actionItems.length > 0 ? (
                            <ActionMenu items={actionItems} />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data?.count || 0)} of {data?.count || 0} employees
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeftMini className="w-5 h-5" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-teal-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRightMini className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Edit Modal */}
      {editingEmployee && (
        <EditSpendingLimitModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={handleSaveSpendingLimit}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteEmployeeModal
          onClose={() => {
            setShowInviteModal(false)
            setInviteError(null)
          }}
          onInvite={handleInvite}
          isInviting={inviteMutation.isPending}
          error={inviteError}
        />
      )}
    </DashboardPageLayout>
  )
}
