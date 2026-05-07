import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RestockAlertsManager } from "./restock-alerts-manager";

export const dynamic = "force-dynamic";

type RestockAlertRow = Prisma.RestockNotificationGetPayload<{
  include: {
    product: {
      select: {
        id: true;
        name: true;
      };
    };
    variant: {
      select: {
        id: true;
        color: true;
        size: true;
      };
    };
  };
}>;

export default async function AdminRestockAlertsPage() {
  let notifications: RestockAlertRow[] = [];

  try {
    notifications = await prisma.restockNotification.findMany({
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
  } catch (error) {
    console.error("[AdminRestockAlertsPage] Failed to load restock alerts:", error);
  }

  return <RestockAlertsManager initialNotifications={notifications} />;
}
