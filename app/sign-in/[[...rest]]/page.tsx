import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { CustomerSignInForm } from "@/components/auth/customer-sign-in-form";
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
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect(resolveSignedInRedirectPath(sessionUser.role, redirect_url, "/"));
  }

  return (
    <AuthShell mode="sign-in">
      <CustomerSignInForm />
    </AuthShell>
  );
}
