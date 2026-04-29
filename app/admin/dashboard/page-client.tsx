"use client";

import ErrorBoundary from "@/components/admin/error-boundary";
import {
  AdminDashboardView,
  type AdminDashboardStats,
} from "@/app/admin/admin-dashboard-view";

export function DashboardPageClient({ stats }: { stats: AdminDashboardStats }) {
  return (
    <ErrorBoundary>
      <AdminDashboardView stats={stats} />
    </ErrorBoundary>
  );
}
