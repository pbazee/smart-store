import { notFound } from "next/navigation";
import { getAdminOrderByIdentifier } from "@/lib/data-service";
import { OrderDetailView } from "./order-detail-view";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderByIdentifier(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailView initialOrder={order} />;
}
