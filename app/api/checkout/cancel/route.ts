import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { releaseReservationForReference } from "@/lib/order-reservations";

const cancelCheckoutSchema = z.object({
  reference: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference } = cancelCheckoutSchema.parse(body);
    const released = await releaseReservationForReference(reference);

    return NextResponse.json({
      success: true,
      data: {
        released,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to cancel checkout";
    console.error("Checkout cancellation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
