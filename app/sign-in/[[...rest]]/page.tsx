import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";
import {
  resolveRequestedRedirectPath,
  resolveSignedInRedirectPath,
} from "@/lib/auth-routing";
import { getSessionUser } from "@/lib/session-user";

export default async function SignInCatchAllPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const { redirect_url } = await searchParams;
  const redirectPath = resolveRequestedRedirectPath(redirect_url, "/");
  const completeSignInPath = `/auth/complete?flow=sign-in&redirect_url=${encodeURIComponent(redirectPath)}`;
  const completeSignUpPath = "/auth/complete?flow=sign-up";
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect(resolveSignedInRedirectPath(sessionUser.role, redirect_url, "/"));
  }

  return (
    <AuthShell mode="sign-in">
      <SignIn
        appearance={clerkAppearance}
        routing="path"
        path="/sign-in"
        oauthFlow="redirect"
        forceRedirectUrl={completeSignInPath}
        fallbackRedirectUrl={completeSignInPath}
        signUpUrl="/sign-up"
        signUpForceRedirectUrl={completeSignUpPath}
        signUpFallbackRedirectUrl={completeSignUpPath}
      />
    </AuthShell>
  );
}
