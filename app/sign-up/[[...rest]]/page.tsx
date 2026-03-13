import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";
import {
  resolveRequestedRedirectPath,
  resolveSignedInRedirectPath,
} from "@/lib/auth-routing";
import { getSessionUser } from "@/lib/session-user";

export default async function SignUpCatchAllPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const { redirect_url } = await searchParams;
  const redirectPath = resolveRequestedRedirectPath(redirect_url, "/");
  const completeSignUpPath = "/auth/complete?flow=sign-up";
  const completeSignInPath = `/auth/complete?flow=sign-in&redirect_url=${encodeURIComponent(redirectPath)}`;
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect(resolveSignedInRedirectPath(sessionUser.role, null, "/"));
  }

  return (
    <AuthShell mode="sign-up">
      <SignUp
        appearance={clerkAppearance}
        routing="path"
        path="/sign-up"
        oauthFlow="redirect"
        forceRedirectUrl={completeSignUpPath}
        fallbackRedirectUrl={completeSignUpPath}
        signInUrl="/sign-in"
        signInForceRedirectUrl={completeSignInPath}
        signInFallbackRedirectUrl={completeSignInPath}
      />
    </AuthShell>
  );
}
