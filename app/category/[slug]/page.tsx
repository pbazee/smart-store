import { redirect } from "next/navigation";
import { buildCatalogHrefFromCategorySlug } from "@/lib/catalog-routing";

export const dynamic = "force-static";
export const revalidate = 300;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(buildCatalogHrefFromCategorySlug(slug));
}
