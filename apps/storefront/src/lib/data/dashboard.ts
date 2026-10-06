import { sdk } from "@/lib/utils/sdk"

export interface DashboardStats {
  total_orders: number
  order_change: number
  pending_quotes: number
  quote_change: number
  monthly_spend: number
  spend_change: number
  total_spend: number
  employee_count: number
}

export interface RecentActivity {
  type: "order" | "quote"
  description: string
  time: string
}

export interface DashboardStatsResponse {
  stats: DashboardStats
  recent_activity: RecentActivity[]
  is_admin: boolean
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return await sdk.client.fetch<DashboardStatsResponse>(
    "/store/dashboard/stats",
    {
      method: "GET",
    }
  )
}
