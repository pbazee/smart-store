import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";

const updateSchema = z.object({
  notified: z.boolean(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const validatedData = updateSchema.parse(body);

  const notification = await prisma.restockNotification.update({
    where: { id },
    data: { notified: validatedData.notified },
  });

  return NextResponse.json({ success: true, data: notification });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.restockNotification.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
