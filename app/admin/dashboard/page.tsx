import { Suspense } from "react";
import { getAdminDashboardStats } from "@/lib/data-service";
import { AdminDashboardView } from "@/app/admin/admin-dashboard-view";
import { 
    StatCardSkeleton, 
    ChartSkeleton, 
    TableSkeleton 
} from "@/components/admin/dashboard-skeletons";

// Revalidate every 60 seconds — matches the cache TTL in getAdminDashboardStats.
// Do NOT use force-dynamic here as it bypasses unstable_cache entirely.
export const revalidate = 60;

function DashboardLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
            <div className="grid gap-8 lg:grid-cols-[1fr,340px]">
                <ChartSkeleton />
                <div className="space-y-6">
                    <div className="h-40 w-full animate-pulse rounded-3xl bg-zinc-900" />
                    <div className="h-60 w-full animate-pulse rounded-3xl bg-zinc-900" />
                </div>
            </div>
            <TableSkeleton />
        </div>
    );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminDashboardView stats={stats} />
    </Suspense>
  );
}
