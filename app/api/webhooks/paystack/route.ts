import { NextRequest, NextResponse } from "next/server";
import { releaseReservationForReference } from "@/lib/order-reservations";
import { finalizePaystackPayment, verifyPaystackTransaction } from "@/lib/paystack";
import crypto from "crypto";

async function verifyPaystackSignature(body: string, signature: string): Promise<boolean> {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
    .update(body)
    .digest("hex");

  return hash === signature;
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const body = await req.text();
    const isValidSignature = await verifyPaystackSignature(body, signature);
    if (!isValidSignature) {
      console.error("Invalid Paystack signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const payload = JSON.parse(body);
    const { event, data: eventData } = payload;
    const reference = eventData?.reference as string | undefined;

    if (event === "charge.failed" && reference) {
      await releaseReservationForReference(reference);
      return NextResponse.json({ success: true });
    }

    if (event === "charge.success") {
      if (!reference) {
        return NextResponse.json({ error: "Missing reference" }, { status: 400 });
      }

      const verification = await verifyPaystackTransaction(reference);
      if (!verification.status || verification.data.status !== "success") {
        return NextResponse.json({ success: true });
      }

      const result = await finalizePaystackPayment({
        reference,
        verifiedAmount: Number(verification.data.amount ?? 0),
        verifiedCurrency: verification.data.currency as string | undefined,
        verifiedEmail: verification.data.customer?.email as string | undefined,
      });

      if (result.state === "processed") {
        console.log(`Payment verified for order ${result.orderNumber}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
