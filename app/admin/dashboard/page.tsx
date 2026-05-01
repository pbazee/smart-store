import { getAdminDashboardStats } from "@/lib/data-service";
import { DashboardPageClient } from "@/app/admin/dashboard/page-client";

// Revalidate every 60 seconds — matches the cache TTL in getAdminDashboardStats.
// Do NOT use force-dynamic here as it bypasses unstable_cache entirely.
export const revalidate = 60;

export default async function AdminDashboardPage() {
  let stats;
  try {
    stats = await getAdminDashboardStats();
  } catch (error) {
    console.error("Failed to load admin dashboard stats:", error);
    stats = {
      totalRevenue: 0,
      revenueTrend: 0,
      totalOrders: 0,
      totalProducts: 0,
      lowStockProducts: [],
      revenueByMonth: [],
      recentOrders: [],
      topProducts: [],
      ordersTrend: [],
      todayOrders: 0,
      pendingOrdersCount: 0,
      needsAttentionCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  return <DashboardPageClient stats={stats} />;
}
