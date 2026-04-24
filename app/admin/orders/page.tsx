import { OrdersTable } from "@/app/admin/orders/orders-table";
import { getAdminOrders, getAdminOrdersCount, getCountOrders } from "@/lib/data-service";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; search?: string; status?: string }>;
}) {
  const { page = "1", limit = "10", search = "", status = "all" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, parseInt(limit));
  
  const [orders, filteredTotal, totalOrders] = await Promise.all([
    getAdminOrders({
      search,
      status,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    getAdminOrdersCount({ search, status }),
    getCountOrders(),
  ]);

  return (
    <OrdersTable 
      initialOrders={orders}
      filteredTotal={filteredTotal}
      totalOrders={totalOrders}
      initialSearch={search}
      initialStatus={status}
      page={pageNum}
      limit={limitNum}
    />
  );
}
