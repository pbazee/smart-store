"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, LockKeyhole } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/admin";
  const [email, setEmail] = useState("admin@store.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Login failed");
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        <p className="font-semibold">Seeded admin access</p>
        <p className="mt-1 text-emerald-100/80">
          Default credentials are prefilled for the seeded admin user.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">Admin email</label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full rounded-2xl border border-white/12 bg-black/35 px-4 text-sm text-white outline-none transition-colors focus:border-brand-400"
          autoComplete="username"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">Password</label>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          className="h-12 w-full rounded-2xl border border-white/12 bg-black/35 px-4 text-sm text-white outline-none transition-colors focus:border-brand-400"
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
        {isSubmitting ? "Signing in..." : "Access Admin Dashboard"}
      </button>
    </form>
  );
}
