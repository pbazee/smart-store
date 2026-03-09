import { NextResponse } from "next/server";
import { mockOrders } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ orders: mockOrders, total: mockOrders.length });
}

export async function POST(request: Request) {
  const body = await request.json();
  const newOrder = {
    id: `ord_${Date.now()}`,
    orderNumber: `SSK-${Math.floor(Math.random() * 9000 + 1000)}`,
    ...body,
    status: "pending",
    paymentStatus: "pending",
    createdAt: new Date().toISOString(),
  };
  return NextResponse.json({ order: newOrder, success: true }, { status: 201 });
}
