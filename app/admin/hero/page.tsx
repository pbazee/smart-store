import { redirect } from "next/navigation";
import { fetchAdminHeroSlides } from "@/app/admin/hero/actions";
import { HeroSlidesManager } from "@/app/admin/hero/hero-slides-manager";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminHeroPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fhero");
  }

  const slides = await fetchAdminHeroSlides();

  return <HeroSlidesManager initialSlides={slides} />;
}
