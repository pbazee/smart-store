import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-identity";

export async function GET() {
  try {
    await requireAdmin();

    const [unreadMessages, pendingOrders, totalSubscribers] = await Promise.all([
      prisma.contactMessage.count({
        where: {
          status: "unread",
        },
      }),
      prisma.order.count({
        where: {
          status: "pending",
        },
      }),
      prisma.newsletterSubscriber.count(),
    ]);

    return NextResponse.json(
      {
        unreadMessages,
        pendingOrders,
        totalSubscribers,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[AdminNotificationCounts] Failed to fetch counts:", error);

    return NextResponse.json(
      {
        error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Failed to fetch notification counts",
      },
      {
        status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
