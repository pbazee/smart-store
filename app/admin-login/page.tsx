import { redirect } from "next/navigation";
import { resolveAdminRedirectPath } from "@/lib/auth-routing";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const { redirect_url } = await searchParams;
  const redirectPath = resolveAdminRedirectPath(redirect_url);
  redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`);
}
