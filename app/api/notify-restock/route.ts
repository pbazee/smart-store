import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const notifyRestockSchema = z.object({
  email: z.string().trim().email(),
  productId: z.string().trim().min(1),
  variantId: z.string().trim().min(1).nullable().optional(),
  sizeName: z.string().trim().min(1).nullable().optional(),
  phone: z.string().trim().min(3).nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = notifyRestockSchema.parse(await request.json());
    const normalizedVariantId = payload.variantId ?? null;
    const normalizedSizeName = payload.sizeName ?? null;
    const normalizedPhone = payload.phone ?? null;

    const product = await prisma.product.findUnique({
      where: { id: payload.productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "That product could not be found.",
        },
        { status: 404 }
      );
    }

    if (normalizedVariantId) {
      const variant = await prisma.variant.findFirst({
        where: {
          id: normalizedVariantId,
          productId: payload.productId,
        },
        select: { id: true },
      });

      if (!variant) {
        return NextResponse.json(
          {
            success: false,
            message: "That product option could not be found.",
          },
          { status: 404 }
        );
      }
    }

    const existingNotification = await prisma.restockNotification.findFirst({
      where: {
        email: payload.email,
        productId: payload.productId,
        variantId: normalizedVariantId,
        sizeName: normalizedSizeName,
      },
      select: { id: true },
    });

    if (existingNotification) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "You already have a restock alert for this product.",
      });
    }

    await prisma.restockNotification.create({
      data: {
        id: crypto.randomUUID(),
        email: payload.email,
        productId: payload.productId,
        variantId: normalizedVariantId,
        sizeName: normalizedSizeName,
        phone: normalizedPhone,
      },
    });

    return NextResponse.json({
      success: true,
      message: "We'll let you know as soon as this item is back in stock.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address.",
          errors: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("[NotifyRestock] Failed to save alert", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to save your restock alert right now.",
      },
      { status: 500 }
    );
  }
}
