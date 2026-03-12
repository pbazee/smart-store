import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";

export async function GET() {
  const sessionUser = await getSessionUser();

  return NextResponse.json(
    {
      success: true,
      data: sessionUser,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
