import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";
import { z } from "zod";

const updateOrderSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateOrderSchema.parse(body);
    const { id } = await params;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: validatedData.status,
        paymentStatus: validatedData.paymentStatus,
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
