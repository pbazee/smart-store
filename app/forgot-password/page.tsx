import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const params = await searchParams;
  const redirectUrl = Array.isArray(params.redirect_url)
    ? params.redirect_url[0]
    : params.redirect_url;

  return (
    <AuthShell mode="forgot-password">
      <PasswordResetRequestForm redirectUrl={redirectUrl} />
    </AuthShell>
  );
}
