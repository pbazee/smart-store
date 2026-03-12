"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, User2 } from "lucide-react";
import { useDemoAuthStore } from "@/lib/demo-auth";

export function DemoAuthPanel() {
  const router = useRouter();
  const signInAs = useDemoAuthStore((state) => state.signInAs);

  const handleDemoSignIn = (role: "customer" | "admin") => {
    signInAs(role);
    router.push(role === "admin" ? "/admin" : "/account");
    router.refresh();
  };

  return (
    <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-md">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.24em] text-brand-300">Demo Login</p>
        <h3 className="mt-2 text-lg font-bold text-white">Jump into the store instantly</h3>
        <p className="mt-1 text-sm text-white/70">
          Use demo identities to preview the customer journey or enter the admin panel.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleDemoSignIn("customer")}
          className="rounded-2xl border border-white/15 bg-white/8 px-4 py-4 text-left transition-colors hover:bg-white/12"
        >
          <User2 className="mb-3 h-5 w-5 text-brand-300" />
          <p className="font-semibold text-white">Customer Demo</p>
          <p className="mt-1 text-sm text-white/65">Browse, wishlist, and place demo orders.</p>
        </button>
        <button
          type="button"
          onClick={() => handleDemoSignIn("admin")}
          className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-left transition-colors hover:bg-emerald-500/16"
        >
          <ShieldCheck className="mb-3 h-5 w-5 text-emerald-300" />
          <p className="font-semibold text-white">Admin Demo</p>
          <p className="mt-1 text-sm text-white/65">Manage products, stock, and storefront merchandising.</p>
        </button>
      </div>
    </div>
  );
}
