import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-identity";
import { deleteShippingZone, SHIPPING_ZONES_CACHE_TAG } from "@/lib/shipping-rules";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    const numericId = Number(id);

    if (!Number.isInteger(numericId)) {
      return NextResponse.json({ error: "Invalid shipping zone id" }, { status: 400 });
    }

    await deleteShippingZone(numericId);
    revalidateTag(SHIPPING_ZONES_CACHE_TAG);
    return NextResponse.json(
      { success: true },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Shipping zone delete failed:", error);
    return NextResponse.json({ error: "Failed to delete shipping zone" }, { status: 500 });
  }
}
