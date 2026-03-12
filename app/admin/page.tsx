import { AdminDashboardView } from "@/app/admin/admin-dashboard-view";
import { getAdminDashboardStats } from "@/lib/data-service";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return <AdminDashboardView stats={stats} />;
}
