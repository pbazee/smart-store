import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/order-reservations";

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const headerToken = request.headers.get("x-cron-secret");

  return bearerToken === configuredSecret || headerToken === configuredSecret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const releasedOrders = await releaseExpiredReservations();
    return NextResponse.json({ success: true, releasedOrders });
  } catch (error) {
    console.error("Reservation cleanup failed:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
