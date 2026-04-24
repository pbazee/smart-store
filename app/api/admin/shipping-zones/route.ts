import { NextRequest, NextResponse } from "next/server";
import { getShippingRules, upsertShippingZones } from "@/lib/shipping-rules";
import { requireAdmin } from "@/lib/admin-identity";
import { z } from "zod";

const shippingZoneSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().trim().min(1),
  county: z.string().trim().optional(),
  counties: z.array(z.string().trim().min(1)).min(1),
  deliveryFeeKES: z.number().int().nonnegative(),
  estimatedDays: z.number().int().positive(),
  freeAboveKES: z.number().int().nonnegative().nullable().optional(),
  isActive: z.boolean(),
});

export async function GET() {
  try {
    await requireAdmin();
    const zones = await getShippingRules();
    return NextResponse.json({ success: true, data: zones });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const zones = z.array(shippingZoneSchema).parse(body.zones);

    const updated = await upsertShippingZones(
      zones.map((zone) => ({
        ...zone,
        id: typeof zone.id === "number" ? zone.id : undefined,
      }))
    );
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Shipping zones save failed:", error);
    return NextResponse.json({ error: "Failed to save shipping zones" }, { status: 400 });
  }
}
