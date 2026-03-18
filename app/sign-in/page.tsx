import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSessionUser } from "@/lib/session-user";
import { SupabaseSignIn } from "@/components/auth/supabase-sign-in";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect("/");
  }

  const params = await searchParams;
  const redirectUrl = Array.isArray(params.redirect_url)
    ? params.redirect_url[0]
    : params.redirect_url;

  return (
    <AuthShell mode="sign-in">
      <SupabaseSignIn redirectUrl={redirectUrl} />
    </AuthShell>
  );
}
