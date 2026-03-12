import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { getSessionUser } from "@/lib/session-user";

export default async function LoginPage() {
  const sessionUser = await getSessionUser();

  if (sessionUser?.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,_#05060a_0%,_#101828_50%,_#140a05_100%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1.05fr,0.95fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.28em] text-brand-300">Operations Access</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.95] sm:text-6xl">
            Admin login for store operators.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">
            This route uses the seeded database admin account and a signed HTTP-only session cookie.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/6 p-4 shadow-[0_20px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
            <div className="mb-6 rounded-[1.6rem] border border-white/10 bg-black/20 p-6">
              <p className="text-xs uppercase tracking-[0.26em] text-white/40">Admin Only</p>
              <h2 className="mt-3 text-3xl font-black">Sign in to manage the store</h2>
              <p className="mt-2 text-sm text-white/65">
                Use the seeded admin credentials or rotate them after first login.
              </p>
            </div>

            <Suspense
              fallback={<div className="h-[332px] rounded-[1.5rem] border border-white/10 bg-black/20" />}
            >
              <AdminLoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
