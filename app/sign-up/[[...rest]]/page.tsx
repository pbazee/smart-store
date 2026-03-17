import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAuthAppearance } from "@/lib/clerk-theme";
import { getSessionUser } from "@/lib/session-user";

export default async function SignUpCatchAllPage({
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect("/");
  }

  return (
    <AuthShell mode="sign-up">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
        oauthFlow="redirect"
        appearance={clerkAuthAppearance}
      />
    </AuthShell>
  );
}
