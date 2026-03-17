import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAuthAppearance } from "@/lib/clerk-theme";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function SignInCatchAllPage({
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect("/");
  }

  return (
    <AuthShell mode="sign-in">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
        oauthFlow="redirect"
        appearance={clerkAuthAppearance}
      />
    </AuthShell>
  );
}
