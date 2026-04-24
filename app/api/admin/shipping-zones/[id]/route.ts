import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-identity";
import { deleteShippingZone } from "@/lib/shipping-rules";

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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shipping zone delete failed:", error);
    return NextResponse.json({ error: "Failed to delete shipping zone" }, { status: 500 });
  }
}
