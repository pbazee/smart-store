import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RestockAlertsManager } from "@/app/admin/restock-alerts/restock-alerts-manager";

export const dynamic = "force-dynamic";

export default async function AdminRestockAlertsPage() {
  try {
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
  } catch (error) {
    const tableNotFound =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

    if (tableNotFound) {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-black text-white">Restock Alerts</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            No restock alerts yet. When customers click &quot;Notify me&quot; on out-of-stock
            products, they will appear here.
          </p>
        </div>
      );
    }

    console.error("[AdminRestockAlertsPage] Failed to load notifications:", error);

    return (
      <div className="p-6">
        <h1 className="text-3xl font-black text-white">Restock Alerts</h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          No restock alerts yet. When customers click &quot;Notify me&quot; on out-of-stock
          products, they will appear here.
        </p>
      </div>
    );
  }
}
