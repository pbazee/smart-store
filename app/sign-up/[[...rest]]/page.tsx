import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";
import { resolveAuthRedirectPath } from "@/lib/auth-routing";
import { getSessionUser } from "@/lib/session-user";

export default async function SignUpCatchAllPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const { redirect_url } = await searchParams;
  const redirectPath = resolveAuthRedirectPath(redirect_url);
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect(redirectPath);
  }

  return (
    <AuthShell mode="sign-up">
      <SignUp
        appearance={clerkAppearance}
        routing="path"
        path="/sign-up"
        forceRedirectUrl={redirectPath}
        fallbackRedirectUrl="/account"
        signInUrl="/sign-in"
        signInForceRedirectUrl={redirectPath}
        signInFallbackRedirectUrl="/account"
      />
    </AuthShell>
  );
}
