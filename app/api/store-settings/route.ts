import { NextResponse } from "next/server";
import { getStoreBranding } from "@/lib/store-branding";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getStoreBranding();
    return NextResponse.json(
      { success: true, data: settings },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Public store settings fetch failed:", error);
    return NextResponse.json({ error: "Failed to load store settings" }, { status: 500 });
  }
}
