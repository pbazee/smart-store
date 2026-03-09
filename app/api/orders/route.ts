import { NextResponse } from "next/server";
import { mockOrders } from "@/lib/mock-data";

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

export async function GET() {
  try {
    if (USE_MOCK_DATA) {
      return NextResponse.json({ orders: mockOrders, total: mockOrders.length });
    } else {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
      });

      await prisma.$disconnect();
      return NextResponse.json({ orders, total: orders.length });
    }
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (USE_MOCK_DATA) {
      // Mock mode
      const newOrder = {
        id: `ord_${Date.now()}`,
        orderNumber: `SSK-${Math.floor(Math.random() * 9000 + 1000)}`,
        ...body,
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ order: newOrder, success: true }, { status: 201 });
    } else {
      // Real database
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      const newOrder = await prisma.order.create({
        data: {
          orderNumber: `SSK-${Math.floor(Math.random() * 9000 + 1000)}`,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          customerPhone: body.customerPhone,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: body.paymentMethod || "paystack",
          total: body.total,
          address: body.address,
          items: body.items,
        },
      });

      await prisma.$disconnect();
      return NextResponse.json({ order: newOrder, success: true }, { status: 201 });
    }
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
