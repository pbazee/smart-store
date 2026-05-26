import { OrdersTable } from "@/app/admin/orders/orders-table";
import {
  getAdminOrders,
  getAdminOrdersCount,
  getCountOrders,
  type AdminOrderListItem,
} from "@/lib/data-service";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    orderStatus?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const {
    page = "1",
    limit = "10",
    search = "",
    orderStatus = "all",
    paymentStatus = "all",
    dateFrom = "",
    dateTo = "",
  } = await searchParams;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, parseInt(limit));
  
  let orders: AdminOrderListItem[] = [];
  let filteredTotal = 0;
  let totalOrders = 0;

  try {
    const results = await Promise.all([
      getAdminOrders({
        search,
        orderStatus,
        paymentStatus,
        dateFrom,
        dateTo,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      getAdminOrdersCount({ search, orderStatus, paymentStatus, dateFrom, dateTo }),
      getCountOrders(),
    ]);
    [orders, filteredTotal, totalOrders] = results;
  } catch (error) {
    console.error("Failed to load admin orders:", error);
    // Return empty state
  }

  return (
    <OrdersTable 
      initialOrders={orders}
      filteredTotal={filteredTotal}
      totalOrders={totalOrders}
      initialSearch={search}
      initialOrderStatus={orderStatus}
      initialPaymentStatus={paymentStatus}
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
      page={pageNum}
      limit={limitNum}
    />
  );
}
