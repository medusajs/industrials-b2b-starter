import { clsx } from "clsx"
import { ReactNode } from "react"

export interface DashboardPageLayoutProps {
  children: ReactNode
  className?: string
}

export function DashboardPageLayout({ children, className }: DashboardPageLayoutProps) {
  return (
    <div className={clsx("p-6 lg:p-8", className)}>
      {children}
    </div>
  )
}
