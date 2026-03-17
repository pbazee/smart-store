import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ClerkAuthView } from "@/components/auth/clerk-auth-view";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

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
      <ClerkAuthView mode="sign-up" />
    </AuthShell>
  );
}
