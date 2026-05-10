import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_req: NextRequest, _context: RouteContext) {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ error: "Restock notifications are disabled" }, { status: 410 });
}

export async function DELETE(_req: NextRequest, _context: RouteContext) {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ error: "Restock notifications are disabled" }, { status: 410 });
}
