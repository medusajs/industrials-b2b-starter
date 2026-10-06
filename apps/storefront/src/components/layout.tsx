import { useState, useEffect } from "react"
import { Outlet } from "@tanstack/react-router"
import { Sidebar } from "./sidebar"
import { PublicLayout } from "./public-layout"
import { useAuth } from "@/lib/hooks/use-auth"
import { CompanyPendingScreen } from "./company-pending-screen"
import { OnboardingTour } from "./onboarding-tour"

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isAuthenticated, isLoading, employee } = useAuth()
  
  console.log("[Layout] render - isAuthenticated:", isAuthenticated, "isLoading:", isLoading)

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar_collapsed")
    if (savedState !== null) {
      setIsCollapsed(savedState === "true")
    }
  }, [])

  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar_collapsed", String(newState))
  }

  // Only show loading when we're loading AND we think the user might be authenticated
  // This prevents loading flash for unauthenticated users on public pages
  const cachedAuthState = typeof window !== "undefined" ? sessionStorage.getItem("auth_state") : null
  const shouldShowLoading = isLoading && (cachedAuthState === "authenticated" || cachedAuthState === null)
  
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // For unauthenticated users, render public layout
  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <Outlet />
      </PublicLayout>
    )
  }

  // Company not yet activated -- show pending review screen
  const companyStatus = employee?.company?.status
  if (companyStatus && companyStatus !== "active") {
    return <CompanyPendingScreen companyName={employee?.company?.name} status={companyStatus} />
  }

  // Show authenticated dashboard layout
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar countryCode="us" collapsed={isCollapsed} onToggle={toggleCollapsed} />
      <main 
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[72px]" : "ml-[280px]"
        }`}
      >
        <Outlet />
      </main>
      <OnboardingTour />
    </div>
  )
}
