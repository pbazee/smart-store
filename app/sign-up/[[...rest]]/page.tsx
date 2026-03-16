import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { CustomerSignUpForm } from "@/components/auth/customer-sign-up-form";
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
  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect(resolveSignedInRedirectPath(sessionUser.role, null, "/"));
  }

  return (
    <AuthShell mode="sign-up">
      <CustomerSignUpForm />
    </AuthShell>
  );
}
