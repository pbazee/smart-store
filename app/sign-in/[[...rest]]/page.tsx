import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";
import { resolveAuthRedirectPath } from "@/lib/auth-routing";
import { getSessionUser } from "@/lib/session-user";

export default async function SignInCatchAllPage({
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

  if (redirectPath.startsWith("/admin")) {
    redirect(`/login?redirect_url=${encodeURIComponent(redirectPath)}`);
  }

  return (
    <AuthShell mode="sign-in">
      <div className="mb-5 rounded-[1.6rem] border border-amber-400/20 bg-amber-500/10 p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200">
          Store Admin
        </p>
        <p className="mt-3 text-sm text-white/80">
          The seeded admin account <span className="font-semibold text-white">admin@store.com</span>
          {" "}uses the local admin login, not the customer Clerk sign-in below.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Go to Admin Login
        </Link>
      </div>
      <SignIn
        appearance={clerkAppearance}
        routing="path"
        path="/sign-in"
        forceRedirectUrl={redirectPath}
        fallbackRedirectUrl="/account"
        signUpUrl="/sign-up"
        signUpForceRedirectUrl={redirectPath}
        signUpFallbackRedirectUrl="/account"
      />
    </AuthShell>
  );
}
