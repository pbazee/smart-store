import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const notifyRestockSchema = z.object({
  productId: z.string().trim().min(1),
  variantId: z.string().trim().min(1).nullable().optional(),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).nullable().optional(),
  sizeName: z.string().trim().min(1).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = notifyRestockSchema.parse(body);

    const email = validatedData.email.trim().toLowerCase();
    const existing = await prisma.restockNotification.findFirst({
      where: {
        email,
        phone: validatedData.phone?.trim() || null,
        productId: validatedData.productId,
        variantId: validatedData.variantId ?? null,
        sizeName: validatedData.sizeName ?? null,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "You're already on the list for this item.",
      });
    }

    await prisma.restockNotification.create({
      data: {
        email,
        phone: validatedData.phone?.trim() || null,
        productId: validatedData.productId,
        variantId: validatedData.variantId ?? null,
        sizeName: validatedData.sizeName ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `We'll email you at ${email} when this is back in stock!`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }

    console.error("Notify restock error:", error);
    return NextResponse.json({ error: "Failed to save restock notification" }, { status: 500 });
  }
}
