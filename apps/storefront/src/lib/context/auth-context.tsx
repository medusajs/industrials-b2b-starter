import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { sdk } from "@/lib/utils/sdk"
import { HttpTypes } from "@medusajs/types"
import { getMe, Employee, CustomerWithEmployee } from "@/lib/data/me"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  customer: HttpTypes.StoreCustomer | null
  employee: Employee | null
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Key to track auth state to avoid loading flash on navigation
const AUTH_STATE_KEY = "auth_state"

export function AuthProvider({ children }: { children: ReactNode }) {
  // Check cached auth state to avoid loading flash
  const cachedAuthState = typeof window !== "undefined" ? sessionStorage.getItem(AUTH_STATE_KEY) : null
  const initialAuthState = cachedAuthState === "authenticated"
  
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthState)
  // Only show loading on very first load when we don't know auth state
  const [isLoading, setIsLoading] = useState(cachedAuthState === null)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)

  const fetchCustomer = useCallback(async () => {
    console.log("[AuthContext] fetchCustomer called")
    try {
      // Fetch basic customer data
      const { customer } = await sdk.store.customer.retrieve()
      console.log("[AuthContext] customer retrieved:", customer?.email)

      // Fetch employee data before updating any state so the layout
      // never sees isAuthenticated=true with employee still null.
      // This prevents the dashboard from flashing before the pending
      // review screen when a company hasn't been activated yet.
      let employeeData: Employee | null = null
      try {
        const { customer: customerWithEmployee } = await getMe()
        if (customerWithEmployee.employee) {
          employeeData = customerWithEmployee.employee
          console.log("[AuthContext] employee data retrieved:", employeeData.is_admin ? "admin" : "buyer")
        }
      } catch {
        // Not a B2B customer or error fetching employee data
      }

      // Batch all state updates together so React renders once with
      // the complete picture (customer + employee + authenticated).
      setCustomer(customer)
      setEmployee(employeeData)
      setIsAuthenticated(true)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUTH_STATE_KEY, "authenticated")
      }
    } catch (error) {
      console.log("[AuthContext] fetchCustomer error:", error)
      setCustomer(null)
      setEmployee(null)
      setIsAuthenticated(false)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUTH_STATE_KEY, "unauthenticated")
      }
    } finally {
      console.log("[AuthContext] fetchCustomer done, setting isLoading=false")
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  const login = async (email: string, password: string) => {
    console.log("[AuthContext] login called")
    await sdk.auth.login("customer", "emailpass", { email, password })
    console.log("[AuthContext] sdk.auth.login successful, fetching customer")
    await fetchCustomer()
    console.log("[AuthContext] login complete, isAuthenticated:", isAuthenticated)
  }

  const logout = async () => {
    try {
      await sdk.auth.logout()
    } finally {
      // Update cached state so navigation doesn't show loading
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUTH_STATE_KEY, "unauthenticated")
      }
      setCustomer(null)
      setEmployee(null)
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }

  const refetch = async () => {
    // Don't set isLoading to true on refetch - it causes full-page spinner
    // Components should handle their own loading states for refetch scenarios
    await fetchCustomer()
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        customer,
        employee,
        isAdmin: employee?.is_admin ?? false,
        login,
        logout,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
