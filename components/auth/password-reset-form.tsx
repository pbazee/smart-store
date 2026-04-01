"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Shield } from "lucide-react";
import { resetCustomerPasswordAction } from "@/app/auth/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordResetForm({
  token,
  email,
  redirectUrl,
}: {
  token: string;
  email: string;
  redirectUrl?: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(resetCustomerPasswordAction, {
    error: null,
    success: false,
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);

    if (password !== confirmPassword) {
      event.preventDefault();
      setClientError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      event.preventDefault();
      setClientError("Password must be at least 8 characters");
    }
  };

  const errorMessage = clientError || state.error;

  return (
    <div className="space-y-6">
      <div className="rounded-[1.1rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/72">
        Resetting password for <span className="font-semibold text-white">{email}</span>. Once this is complete, you will be signed in automatically.
      </div>

      {errorMessage ? (
        <div className="rounded-[1.1rem] border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-200" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      ) : null}

      <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="redirectUrl" value={redirectUrl || "/account"} />

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-white/88">
            New Password
          </Label>
          <div className="relative">
            <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="........"
              required
              minLength={8}
              className="h-12 rounded-[1.1rem] border border-white/12 bg-black/35 pl-11 text-white placeholder:text-white/45 focus:border-orange-400 focus:ring-orange-400/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/88">
            Confirm New Password
          </Label>
          <div className="relative">
            <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="........"
              required
              className="h-12 rounded-[1.1rem] border border-white/12 bg-black/35 pl-11 text-white placeholder:text-white/45 focus:border-orange-400 focus:ring-orange-400/20"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 h-12 w-full rounded-[1.1rem] bg-orange-500 text-sm font-bold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition-colors hover:bg-orange-600"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-white/55">
        Need another link?{" "}
        <Link
          href={
            redirectUrl
              ? `/forgot-password?redirect_url=${encodeURIComponent(redirectUrl)}`
              : "/forgot-password"
          }
          className="font-semibold text-orange-300 hover:text-orange-200"
        >
          Request a fresh reset email
        </Link>
      </p>
    </div>
  );
}
