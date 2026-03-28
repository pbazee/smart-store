import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { resolveAuthRedirectPath, resolveSignedInRedirectPath } from "@/lib/auth-routing";
import { getSessionUser } from "@/lib/session-user";
import { SupabaseSignUp } from "@/components/auth/supabase-sign-up";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const params = await searchParams;
  const redirectUrl = Array.isArray(params.redirect_url)
    ? params.redirect_url[0]
    : params.redirect_url;
  const redirectPath = resolveAuthRedirectPath(redirectUrl, "/");
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect(resolveSignedInRedirectPath(sessionUser.role, redirectPath));
  }

  return (
    <AuthShell mode="sign-up">
      <SupabaseSignUp redirectUrl={redirectUrl} />
    </AuthShell>
  );
}
