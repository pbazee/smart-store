import { NextResponse } from "next/server";
import { getAdminDashboardStats } from "@/lib/data-service";
import { requireAdmin } from "@/lib/admin-identity";

export const revalidate = 60; // Revalidate every 60 seconds
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getAdminDashboardStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Admin stats fetch failed:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
