import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Restock notifications are temporarily unavailable.",
    },
    { status: 503 }
  );
}
