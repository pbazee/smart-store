import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth-utils";

export async function GET() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, data: [] });
}
