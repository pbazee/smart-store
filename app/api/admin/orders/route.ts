import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-identity";
import { getAdminOrders, getAdminOrdersCount, getCountOrders } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const status = request.nextUrl.searchParams.get("status")?.trim() || "all";
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1));
    const limit = Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 10));
    const skip = (page - 1) * limit;

    const [orders, filteredTotal, totalOrders] = await Promise.all([
      getAdminOrders({ search, status, skip, take: limit }),
      getAdminOrdersCount({ search, status }),
      getCountOrders(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: orders,
        meta: {
          page,
          limit,
          filteredTotal,
          totalOrders,
          totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
          search,
          status,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Admin orders fetch failed:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
