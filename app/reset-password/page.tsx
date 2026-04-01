import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { validatePasswordResetLink } from "@/lib/password-reset-service";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; redirect_url?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const redirectUrl = Array.isArray(params.redirect_url)
    ? params.redirect_url[0]
    : params.redirect_url;

  if (!token) {
    redirect(
      redirectUrl
        ? `/forgot-password?redirect_url=${encodeURIComponent(redirectUrl)}`
        : "/forgot-password"
    );
  }

  const validation = await validatePasswordResetLink(token);

  return (
    <AuthShell mode="reset-password">
      {validation.ok ? (
        <PasswordResetForm
          token={token}
          email={validation.user.email}
          redirectUrl={redirectUrl}
        />
      ) : (
        <div className="space-y-6">
          <div className="rounded-[1.1rem] border border-rose-400/30 bg-rose-500/10 p-5 text-rose-100">
            <p className="text-sm leading-6">{validation.error}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={
                redirectUrl
                  ? `/forgot-password?redirect_url=${encodeURIComponent(redirectUrl)}`
                  : "/forgot-password"
              }
              className="flex-1 rounded-[1.1rem] bg-orange-500 px-5 py-3 text-center text-sm font-bold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-colors hover:bg-orange-600"
            >
              Request a new reset link
            </Link>
            <Link
              href={redirectUrl ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}` : "/sign-in"}
              className="flex-1 rounded-[1.1rem] border border-white/12 bg-black/25 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-black/35"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
