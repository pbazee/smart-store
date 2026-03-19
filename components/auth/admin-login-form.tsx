"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, Shield, Loader2 } from "lucide-react";
import {
  submitAdminLoginAction,
  type AdminLoginActionState,
} from "@/app/admin-login/actions";
import { useToast } from "@/lib/use-toast";

const initialState: AdminLoginActionState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
      {pending ? "Signing in..." : "Login"}
    </button>
  );
}

export function AdminLoginForm({ redirectUrl }: { redirectUrl: string }) {
  const { toast } = useToast();
  const [state, formAction] = useFormState(submitAdminLoginAction, initialState);

  useEffect(() => {
    if (!state.error) {
      return;
    }

    toast({
      title: "Invalid credentials",
      description: state.error,
      variant: "destructive",
    });
  }, [state.error, toast]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="redirectUrl" value={redirectUrl} />

      <div className="rounded-2xl border border-white/12 bg-black/25 p-4 text-sm text-white/70">
        This login is reserved for staff with admin privileges.
      </div>

      <div>
        <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-white/80">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="name@company.com"
          className="h-12 w-full rounded-2xl border border-white/12 bg-black/35 px-4 text-sm text-white outline-none transition-colors focus:border-brand-400"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-white/80">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="Enter your password"
          className="h-12 w-full rounded-2xl border border-white/12 bg-black/35 px-4 text-sm text-white outline-none transition-colors focus:border-brand-400"
        />
      </div>

      {state.error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Invalid credentials
          </div>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
