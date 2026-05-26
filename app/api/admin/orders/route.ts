import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-identity";
import { getAdminOrders, getAdminOrdersCount, getCountOrders } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const orderStatus = request.nextUrl.searchParams.get("orderStatus")?.trim() || "all";
    const paymentStatus = request.nextUrl.searchParams.get("paymentStatus")?.trim() || "all";
    const dateFrom = request.nextUrl.searchParams.get("dateFrom")?.trim() || "";
    const dateTo = request.nextUrl.searchParams.get("dateTo")?.trim() || "";
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1));
    const limit = Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 10));
    const skip = (page - 1) * limit;

    const [orders, filteredTotal, totalOrders] = await Promise.all([
      getAdminOrders({ search, orderStatus, paymentStatus, dateFrom, dateTo, skip, take: limit }),
      getAdminOrdersCount({ search, orderStatus, paymentStatus, dateFrom, dateTo }),
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
          orderStatus,
          paymentStatus,
          dateFrom,
          dateTo,
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
    return NextResponse.json(
      { error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Failed to fetch orders" },
      {
        status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
