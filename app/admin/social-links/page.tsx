import { redirect } from "next/navigation";
import { SocialLinksManager } from "@/app/admin/social-links/social-links-manager";
import { fetchAdminSocialLinks } from "@/app/admin/social-links/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminSocialLinksPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fsocial-links");
  }

  const socialLinks = await fetchAdminSocialLinks();

  return <SocialLinksManager initialSocialLinks={socialLinks} />;
}
