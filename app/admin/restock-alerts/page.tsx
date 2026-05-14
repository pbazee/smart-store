import { prisma } from "@/lib/prisma";
import { RestockAlertsManager } from "@/app/admin/restock-alerts/restock-alerts-manager";

export const dynamic = "force-dynamic";

export default async function AdminRestockAlertsPage() {
  const notifications = await prisma.restockNotification.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      variant: {
        select: {
          id: true,
          color: true,
          size: true,
        },
      },
    },
  });

  return <RestockAlertsManager initialNotifications={notifications} />;
}
