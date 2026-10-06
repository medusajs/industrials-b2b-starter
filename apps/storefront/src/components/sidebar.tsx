import { Link, useRouterState, useNavigate } from "@tanstack/react-router"
import { useCart } from "@/lib/hooks/use-cart"
import { useAuth } from "@/lib/hooks/use-auth"
import { useState } from "react"
import { ProLiftMark } from "@/components/prolift-mark"
import { SearchDrawer } from "@/components/search/search-drawer"

interface SidebarProps {
  countryCode: string
  collapsed?: boolean
  onToggle?: () => void
}

// Custom icons as inline SVGs
const DashboardIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const CatalogIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const CartIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const OrdersIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

const QuotesIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const HelpIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const BuildingIcon = () => (
  <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {collapsed ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    )}
  </svg>
)

export function Sidebar({ countryCode, collapsed = false, onToggle }: SidebarProps) {
  const routerState = useRouterState()
  const navigate = useNavigate()
  const currentPath = routerState.location.pathname
  const { data: cart } = useCart()
  const { customer, logout, isAdmin, employee } = useAuth()
  const cartItemsCount = cart?.items?.length || 0

  const customerName = customer?.first_name && customer?.last_name
    ? `${customer.first_name} ${customer.last_name}`
    : customer?.email || "User"
  
  const customerInitials = customer?.first_name && customer?.last_name
    ? `${customer.first_name[0]}${customer.last_name[0]}`.toUpperCase()
    : customer?.email?.[0]?.toUpperCase() || "U"

  const handleLogout = async () => {
    await logout()
    // Navigate to the public storefront home
    window.location.href = `/${countryCode}`
  }

  const isActive = (path: string) => {
    if (path === `/${countryCode}`) {
      return currentPath === `/${countryCode}` || currentPath === `/${countryCode}/`
    }
    return currentPath.startsWith(path)
  }

  const navLinkClass = (path: string) => {
    const active = isActive(path)
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
        ? "bg-accent text-white"
        : "text-slate-400 hover:bg-slate-700 hover:text-white"
    } ${collapsed ? "justify-center" : ""}`
  }

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[280px]"

  return (
    <aside className={`fixed left-0 top-0 h-screen ${sidebarWidth} bg-sidebar flex flex-col z-50 transition-all duration-300 ease-in-out`}>
      {/* Logo & Toggle */}
      <div className={`p-4 border-b border-white/10 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        <Link to="/$countryCode" params={{ countryCode }} className={`flex items-center gap-3 ${collapsed ? "" : "flex-1"}`}>
          {employee?.company?.logo_url ? (
            <img
              src={employee.company.logo_url}
              alt={employee.company.name}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <ProLiftMark size={40} bg="#0f172a" color="#0d9488" />
          )}
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-white font-bold text-lg block leading-tight">ProLift</span>
              <span className="text-slate-400 text-xs truncate block">{employee?.company?.name || "Equipment Portal"}</span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        )}
      </div>

      {/* Toggle button when collapsed - shown at top */}
      {collapsed && (
        <div className="p-2 flex justify-center">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            aria-label="Expand sidebar"
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        {/* Operations */}
        <div>
          {!collapsed && (
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Operations
            </h3>
          )}
          <div className="space-y-1">
            <SearchDrawer
              triggerClassName={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer ${
                collapsed ? "justify-center" : ""
              }`}
              triggerLabel={collapsed ? undefined : "Search"}
            />
            <Link
              to="/$countryCode" params={{ countryCode }}
              className={navLinkClass(`/${countryCode}`)}
              title={collapsed ? "Dashboard" : undefined}
              data-tour="dashboard"
            >
              <DashboardIcon />
              {!collapsed && "Dashboard"}
            </Link>
            <Link 
              to="/$countryCode/store" params={{ countryCode }} 
              className={navLinkClass(`/${countryCode}/store`)}
              title={collapsed ? "Product Catalog" : undefined}
              data-tour="catalog"
            >
              <CatalogIcon />
              {!collapsed && "Product Catalog"}
            </Link>
            <Link 
              to="/$countryCode/cart" params={{ countryCode }} 
              className={`${navLinkClass(`/${countryCode}/cart`)} relative`}
              title={collapsed ? "Cart" : undefined}
              data-tour="cart"
            >
              <CartIcon />
              {!collapsed && "Cart"}
              {cartItemsCount > 0 && (
                <span className={`bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full ${collapsed ? "absolute -top-1 -right-1 px-1.5" : "ml-auto"}`}>
                  {cartItemsCount}
                </span>
              )}
            </Link>
            <Link 
              to="/$countryCode/orders" params={{ countryCode }}
              className={navLinkClass(`/${countryCode}/orders`)}
              title={collapsed ? "Order History" : undefined}
              data-tour="orders"
            >
              <OrdersIcon />
              {!collapsed && "Order History"}
            </Link>
            <Link 
              to="/$countryCode/quotes" params={{ countryCode }}
              className={navLinkClass(`/${countryCode}/quotes`)}
              title={collapsed ? "Quotes" : undefined}
              data-tour="quotes"
            >
              <QuotesIcon />
              {!collapsed && "Quotes"}
            </Link>
          </div>
        </div>

        {/* Administration - Employees for admins only, Settings for all */}
        <div>
          {!collapsed && (
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {isAdmin ? "Administration" : "Account"}
            </h3>
          )}
          {collapsed && <div className="border-t border-white/10 my-2" />}
          <div className="space-y-1">
            {isAdmin && (
              <Link 
                to="/$countryCode/employees" params={{ countryCode }}
                className={navLinkClass(`/${countryCode}/employees`)}
                title={collapsed ? "Employees" : undefined}
                data-tour="employees"
              >
                <UsersIcon />
                {!collapsed && "Employees"}
              </Link>
            )}
            <Link 
              to="/$countryCode/settings" params={{ countryCode }}
              className={navLinkClass(`/${countryCode}/settings`)}
              title={collapsed ? "Settings" : undefined}
              data-tour="settings"
            >
              <SettingsIcon />
              {!collapsed && "Settings"}
            </Link>
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className={`p-2 border-t border-white/10 ${collapsed ? "space-y-2" : "space-y-1"}`}>
        <button 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors w-full ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Help & Support" : undefined}
        >
          <HelpIcon />
          {!collapsed && "Help & Support"}
        </button>
        
        {/* User Profile */}
        <div className={`flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-700/50 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-accent font-semibold text-sm">{customerInitials}</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{customerName}</p>
                <p className="text-slate-400 text-xs truncate">{customer?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogoutIcon />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
