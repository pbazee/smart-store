import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-utils";
import { CATEGORY_CACHE_TAG } from "@/lib/category-service";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function revalidateCategorySurfaces() {
  revalidateTag(CATEGORY_CACHE_TAG);
  revalidateTag(HOMEPAGE_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [hasProducts, hasChildren] = await Promise.all([
      prisma.product.count({ where: { categoryId: id } }),
      prisma.category.count({ where: { parentId: id } }),
    ]);

    if (hasProducts > 0 || hasChildren > 0) {
      return NextResponse.json(
        { error: "Cannot delete a category that still has products or subcategories." },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    revalidateCategorySurfaces();

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
