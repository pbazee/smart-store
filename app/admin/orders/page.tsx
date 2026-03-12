import { OrdersTable } from "@/app/admin/orders/orders-table";
import { getAllOrders } from "@/lib/data-service";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return <OrdersTable initialOrders={orders} />;
}
