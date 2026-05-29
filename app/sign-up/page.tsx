import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { resolveAuthRedirectPath, resolveSignedInRedirectPath } from "@/lib/auth-routing";
import { getStoreBranding } from "@/lib/store-branding";
import { getSessionUser } from "@/lib/session-user";
import { SupabaseSignUp } from "@/components/auth/supabase-sign-up";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    redirect?: string | string[];
    redirect_url?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const callbackUrl = Array.isArray(params.callbackUrl) ? params.callbackUrl[0] : params.callbackUrl;
  const redirectUrl = Array.isArray(params.redirect)
    ? params.redirect[0]
    : params.redirect ?? callbackUrl ?? (Array.isArray(params.redirect_url) ? params.redirect_url[0] : params.redirect_url);
  const redirectPath = resolveAuthRedirectPath(redirectUrl, "/");
  const sessionUser = await getSessionUser();
  const storeSettings = await getStoreBranding().catch(() => null);

  if (sessionUser) {
    redirect(resolveSignedInRedirectPath(sessionUser.role, redirectPath));
  }

  return (
    <AuthShell mode="sign-up" redirectPath={redirectPath} storeSettings={storeSettings}>
      <SupabaseSignUp redirectUrl={redirectPath} />
    </AuthShell>
  );
}
