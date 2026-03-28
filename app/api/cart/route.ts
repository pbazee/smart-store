import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSavedCartItems, saveSavedCartItems } from "@/lib/cart-service";
import { requireSessionUser } from "@/lib/session-user";

const cartItemSchema = z.object({
  variantId: z.string().trim().min(1),
  quantity: z.number().int().positive(),
});

const saveCartSchema = z.object({
  items: z.array(cartItemSchema),
});

function buildNoStoreResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

export async function GET() {
  try {
    const sessionUser = await requireSessionUser();
    const items = await getSavedCartItems(sessionUser);

    return buildNoStoreResponse({
      success: true,
      data: {
        items,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return buildNoStoreResponse({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[Cart] Failed to load saved cart:", error);
    return buildNoStoreResponse({ error: "Failed to load cart" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await requireSessionUser();
    const body = await request.json();
    const { items } = saveCartSchema.parse(body);
    const savedItems = await saveSavedCartItems(sessionUser, items);

    return buildNoStoreResponse({
      success: true,
      data: {
        items: savedItems,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return buildNoStoreResponse({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return buildNoStoreResponse(
        { error: error.errors[0]?.message ?? "Invalid cart payload" },
        { status: 400 }
      );
    }

    console.error("[Cart] Failed to save cart:", error);
    return buildNoStoreResponse({ error: "Failed to save cart" }, { status: 500 });
  }
}
