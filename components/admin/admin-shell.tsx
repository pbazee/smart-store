"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  MapPin,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  MessageCircleMore,
  NotebookText,
  Package,
  Settings,
  Share,
  ShoppingCart,
  Sparkles,
  Star,
  TicketPercent,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRoutePrefetch } from "@/hooks/use-route-prefetch";
import { useSessionUser } from "@/hooks/use-session-user";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: React.ReactNode;
  subscriberCount: number;
};

type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
};

function getAdminNavItems(subscriberCount: number): AdminNavItem[] {
  return [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/messages", label: "Messages", icon: Mail },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/announcements", label: "Announcements", icon: Bell },
    { href: "/admin/hero", label: "Hero Slides", icon: Sparkles },
    { href: "/admin/homepage-categories", label: "Homepage Categories", icon: LayoutGrid },
    { href: "/admin/blogs", label: "Blogs", icon: NotebookText },
    { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    { href: "/admin/shipping-rules", label: "Shipping Rules", icon: MapPin },
    { href: "/admin/popups", label: "Popups", icon: Sparkles },
    { href: "/admin/newsletter", label: "Subscribers", icon: Users, count: subscriberCount },
    { href: "/admin/social-links", label: "Social Links", icon: Share },
    { href: "/admin/reviews", label: "Reviews", icon: MessageCircleMore },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];
}

function isActiveAdminPath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(label: string) {
  const cleaned = label.trim();

  if (!cleaned) {
    return "AD";
  }

  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "AD";
}

function AdminNav({
  pathname,
  subscriberCount,
  onNavigate,
}: {
  pathname: string;
  subscriberCount: number;
  onNavigate?: () => void;
}) {
  const navItems = useMemo(() => getAdminNavItems(subscriberCount), [subscriberCount]);

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive = isActiveAdminPath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200",
              isActive
                ? "border-brand-400/30 bg-brand-500/15 text-white shadow-[0_18px_40px_rgba(249,115,22,0.12)]"
                : "border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/80 hover:text-zinc-100"
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                  isActive
                    ? "border-brand-400/30 bg-brand-500/15 text-brand-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-500 group-hover:border-zinc-700 group-hover:text-zinc-200"
                )}
              >
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 truncate">{item.label}</span>
            </span>

            {typeof item.count === "number" && (
              <span
                className={cn(
                  "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-[11px] font-bold",
                  isActive
                    ? "bg-white/10 text-white"
                    : "bg-zinc-900 text-zinc-300 group-hover:bg-zinc-800"
                )}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function AdminSidebarContent({
  pathname,
  subscriberCount,
  sessionLabel,
  sessionEmail,
  onNavigate,
}: {
  pathname: string;
  subscriberCount: number;
  sessionLabel: string;
  sessionEmail: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-zinc-800/80 px-5 py-5">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-sm font-black text-white shadow-[0_0_28px_rgba(249,115,22,0.24)]">
            SK
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">Smartest Store KE</p>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Admin Panel</p>
          </div>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <AdminNav
          pathname={pathname}
          subscriberCount={subscriberCount}
          onNavigate={onNavigate}
        />
      </div>

      <div className="border-t border-zinc-800/80 px-4 py-4">
        <p className="truncate text-sm font-semibold text-zinc-100">{sessionLabel}</p>
        <p className="truncate text-xs text-zinc-500">{sessionEmail}</p>

        <Link
          href="/"
          onClick={onNavigate}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.25)] transition hover:bg-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({ children, subscriberCount }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionUser, signOut } = useSessionUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sessionLabel = sessionUser?.fullName || sessionUser?.email || "Admin session";
  const sessionEmail = sessionUser?.email || "Manage the storefront";
  const sessionInitials = getInitials(sessionLabel);

  useRoutePrefetch(["/", "/shop", "/contact", "/faq", "/about"]);

  const handleSignOut = () => {
    void signOut().then(() => {
      setMobileNavOpen(false);
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[18rem,minmax(0,1fr)]">
        <aside className="hidden border-r border-zinc-800/80 bg-zinc-950/95 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
          <AdminSidebarContent
            pathname={pathname}
            subscriberCount={subscriberCount}
            sessionLabel={sessionLabel}
            sessionEmail={sessionEmail}
          />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-col lg:h-screen">
          <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/92 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 transition-colors hover:border-zinc-700 hover:bg-zinc-800 lg:hidden"
                aria-label="Open admin navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-sm font-black text-white shadow-[0_0_28px_rgba(249,115,22,0.24)]">
                    SK
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white sm:text-base">
                      Smartest Store KE
                    </p>
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      Admin Panel
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-300 md:inline-flex">
                <Mail className="h-3.5 w-3.5 text-brand-400" />
                {subscriberCount} Subscribers
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-2 sm:flex">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">
                    {sessionInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="max-w-[12rem] truncate text-sm font-semibold text-white">
                      {sessionLabel}
                    </p>
                    <p className="max-w-[12rem] truncate text-xs text-zinc-500">
                      {sessionEmail}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[88vw] max-w-[20rem] border-zinc-800 bg-zinc-950 p-0 text-zinc-100"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Admin navigation</SheetTitle>
            <SheetDescription>
              Browse admin sections, review subscribers, and manage your session.
            </SheetDescription>
          </SheetHeader>

          <AdminSidebarContent
            pathname={pathname}
            subscriberCount={subscriberCount}
            sessionLabel={sessionLabel}
            sessionEmail={sessionEmail}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
