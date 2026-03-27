import { redirect } from "next/navigation";
import { buildCatalogHref } from "@/lib/catalog-routing";
import type { CatalogQueryInput } from "@/lib/catalog-routing";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogQueryInput>;
}) {
  const params = await searchParams;
  redirect(buildCatalogHref(params));
}
