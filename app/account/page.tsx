import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  Package2,
  ShieldCheck,
  User2,
} from "lucide-react";
import { getSessionUser } from "@/lib/session-user";

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

export default async function AccountPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/sign-in?redirect_url=%2Faccount");
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
                  : "Live account session is active with Clerk-backed authentication."}
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
              href="/admin"
              className="block rounded-[1.75rem] border border-brand-300/30 bg-brand-500/10 p-6 transition-colors hover:border-brand-300"
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

          <div className="rounded-[1.75rem] border border-border bg-card p-6">
            <p className="text-sm font-semibold">Sign out</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the avatar menu in the header to sign out from your current session.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
