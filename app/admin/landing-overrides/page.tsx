import { redirect } from "next/navigation";
import { LandingOverridesManager } from "@/app/admin/landing-overrides/landing-overrides-manager";
import { requireAdminAuth } from "@/lib/auth-utils";
import { getProducts } from "@/lib/data-service";
import { listLandingOverrides } from "@/lib/landing-section-overrides";

export default async function LandingOverridesPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Flanding-overrides");
  }

  const [overrides, products] = await Promise.all([
    listLandingOverrides(),
    getProducts({ take: 200 }, { cacheKey: "admin:landing-products" }),
  ]);

  return <LandingOverridesManager initialOverrides={overrides} products={products} />;
}
