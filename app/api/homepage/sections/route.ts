import { NextResponse } from "next/server";
import {
  getHomepageBlogPosts,
  getHomepageLatestReviews,
  getHomepageProductSectionsData,
} from "@/lib/homepage-data";

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
    const [productSections, latestReviews, blogPosts] = await Promise.all([
      getHomepageProductSectionsData(),
      getHomepageLatestReviews(),
      getHomepageBlogPosts(),
    ]);

    return buildNoStoreResponse({
      success: true,
      data: {
        productSections,
        latestReviews,
        blogPosts,
      },
    });
  } catch (error) {
    console.error("[Homepage] Failed to load storefront sections:", error);
    return buildNoStoreResponse(
      { success: false, error: "Failed to load homepage sections" },
      { status: 500 }
    );
  }
}
