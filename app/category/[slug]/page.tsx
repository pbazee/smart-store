import { redirect } from "next/navigation";
import { buildCatalogHrefFromCategorySlug } from "@/lib/catalog-routing";

export const revalidate = 0;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(buildCatalogHrefFromCategorySlug(slug));
}
