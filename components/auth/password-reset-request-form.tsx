"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { requestCustomerPasswordResetAction } from "@/app/auth/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordResetRequestForm({
  redirectUrl,
}: {
  redirectUrl?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, formAction, isPending] = useActionState(
    requestCustomerPasswordResetAction,
    {
      error: null,
      success: false,
      message: null,
    }
  );

  return (
    <div className="space-y-6">
      {state.message ? (
        <div className="rounded-[1.1rem] border border-emerald-400/25 bg-emerald-500/10 p-4 text-emerald-100">
          <p className="text-sm leading-6">{state.message}</p>
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-[1.1rem] border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-200" />
            <p className="text-sm">{state.error}</p>
          </div>
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirectUrl" value={redirectUrl || "/account"} />

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-white/88">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
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
              Sending reset link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <div className="rounded-[1.1rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/72">
        Reset links expire after 60 minutes and become unusable as soon as you successfully choose a new password.
      </div>

      <p className="text-center text-sm text-white/55">
        Remembered it?{" "}
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
