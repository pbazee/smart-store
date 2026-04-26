import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-identity";
import { getAdminDashboardStats } from "@/lib/data-service";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getAdminDashboardStats();

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Admin stats fetch failed:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
