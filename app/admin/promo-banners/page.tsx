import { redirect } from "next/navigation";
import { fetchAdminPromoBanners } from "@/app/admin/promo-banners/actions";
import { PromoBannersManager } from "@/app/admin/promo-banners/promo-banners-manager";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminPromoBannersPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fpromo-banners");
  }

  const banners = await fetchAdminPromoBanners();

  return <PromoBannersManager initialBanners={banners} />;
}
