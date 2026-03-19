"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClientClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Mail, User, Shield } from "lucide-react";
import { getAppUrl } from "@/lib/app-url";

export function SupabaseSignUp({ redirectUrl }: { redirectUrl?: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseClientClient();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${getAppUrl()}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/sign-in?message=check-email");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getAppUrl()}/auth/callback?next=${redirectUrl || "/"}`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google OAuth Button */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full min-h-[72px] rounded-[1.6rem] border border-white/75 bg-white px-5 text-slate-950 shadow-[0_18px_44px_rgba(249,115,22,0.26)] ring-1 ring-white/60 transition-all duration-200 hover:scale-[1.02] hover:bg-orange-50 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.85),0_24px_54px_rgba(249,115,22,0.3)]"
      >
        <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-base font-black">Continue with Google</span>
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/12" />
        </div>
        <div className="relative flex justify-center text-xs font-bold uppercase tracking-[0.24em]">
          <span className="bg-black/20 px-4 text-white/72">Or create account with email</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-[1.1rem] border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-200" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Sign Up Form */}
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-white/88">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className="h-12 rounded-[1.1rem] border border-white/12 bg-black/35 pl-11 text-white placeholder:text-white/45 focus:border-orange-400 focus:ring-orange-400/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-white/88">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-12 rounded-[1.1rem] border border-white/12 bg-black/35 pl-11 text-white placeholder:text-white/45 focus:border-orange-400 focus:ring-orange-400/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-white/88">
            Password
          </Label>
          <div className="relative">
            <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="h-12 rounded-[1.1rem] border border-white/12 bg-black/35 pl-11 text-white placeholder:text-white/45 focus:border-orange-400 focus:ring-orange-400/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/88">
            Confirm Password
          </Label>
          <div className="relative">
            <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-12 rounded-[1.1rem] border border-white/12 bg-black/35 pl-11 text-white placeholder:text-white/45 focus:border-orange-400 focus:ring-orange-400/20"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-12 w-full rounded-[1.1rem] bg-orange-500 text-sm font-bold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-colors hover:bg-orange-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      {/* Sign In Link */}
      <p className="text-center text-sm text-white/55">
        Already have an account?{" "}
        <Link
          href={redirectUrl ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}` : "/sign-in"}
          className="font-semibold text-orange-300 hover:text-orange-200"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
