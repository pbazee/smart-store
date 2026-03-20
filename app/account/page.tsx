"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Package2,
  ShieldCheck,
  User2,
} from "lucide-react";
import { useSessionUser } from "@/hooks/use-session-user";

const accountLinks = [
  {
    href: "/orders",
    title: "My Orders",
    description: "Track active deliveries, past purchases, and payment status.",
    icon: Package2,
  },
  {
    href: "/wishlist",
    title: "Wishlist",
    description: "Saved pieces, future drops, and quick access to favorites.",
    icon: Heart,
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { sessionUser, signOut, isLoading } = useSessionUser();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Please sign in to view your account.</p>
          <Link
            href="/sign-in?redirect_url=%2Faccount"
            className="mt-4 inline-block rounded-xl bg-brand-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="rounded-[2rem] border border-border bg-card p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">
            My account
          </p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-tight">
            {sessionUser.fullName || sessionUser.firstName || "Smart Shopper"}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Manage orders, saved items, and profile access across checkout, delivery tracking, and
            future drops.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border bg-background p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User2 className="h-4 w-4 text-brand-500" />
                Account
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{sessionUser.email || "No email on file"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Role: <span className="font-medium capitalize text-foreground">{sessionUser.role}</span>
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-background p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Session
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {sessionUser.isDemo
                  ? "Demo login is active. You can test shopping, wishlist, and order flows instantly."
                  : "Live account session is active with secure authentication."}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {accountLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-[1.75rem] border border-border bg-card p-6 transition-colors hover:border-brand-300 hover:bg-background"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-500/10 p-3 text-brand-500">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}

          {sessionUser.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className="block rounded-[1.75rem] border border-brand-300/30 bg-brand-500/10 p-6 transition-all hover:border-brand-300 hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-500 p-3 text-white">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Admin Console</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage products, inventory, and orders without leaving the storefront.
                  </p>
                </div>
              </div>
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="w-full rounded-[1.75rem] border border-border bg-card p-6 text-left transition-colors hover:border-destructive/50 hover:bg-destructive/5"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Sign out</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click to sign out from your current session.
                </p>
              </div>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
}
