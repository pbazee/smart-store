"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  MessageCircle,
  NotebookText,
  Package,
  ShoppingCart,
  Settings,
  Database,
  ArrowLeft,
  LogOut,
  User2,
  TicketPercent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useDemoStore } from "@/lib/store";
import { getStoreLogoSetFromSettings } from "@/lib/store-branding";
import { useSessionUser } from "@/hooks/use-session-user";
import type { StoreSettings } from "@/types";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: User2 },
  { href: "/admin/messages", label: "Messages", icon: MessageCircle },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/reviews", label: "Reviews", icon: MessageCircle },
  { href: "/admin/announcements", label: "Announcements", icon: Bell },
  { href: "/admin/blogs", label: "Blogs", icon: NotebookText },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/homepage-categories", label: "Homepage Categories", icon: LayoutGrid },
  { href: "/admin/landing-overrides", label: "Landing Page Overrides", icon: MapPin },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayoutProtected({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isMockMode, toggleMockMode } = useDemoStore();
  const { sessionUser, signOut } = useSessionUser();
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const branding = getStoreLogoSetFromSettings(storeSettings);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/store-settings", { cache: "no-store" });
        const data = await response.json();
        if (!cancelled && response.ok && data?.data) {
          setStoreSettings(data.data as StoreSettings);
        }
      } catch (error) {
        console.error("Failed to refresh protected admin branding:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col fixed h-full">
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            {branding.logoDarkUrl || branding.logoUrl ? (
              <div className="relative h-8 w-[116px]">
                <Image
                  src={branding.logoDarkUrl || branding.logoUrl || ""}
                  alt={branding.storeName}
                  fill
                  sizes="116px"
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-7 h-7 bg-brand-500 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xs">SK</span>
              </div>
            )}
            <span className="font-bold text-sm">{branding.storeName}</span>
          </div>
          <p className="text-xs text-zinc-500">Admin Panel</p>
        </div>

        {/* Demo Mode Banner */}
        <div className={cn(
          "mx-3 mt-3 p-3 rounded-xl border text-xs",
          isMockMode
            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
            : "bg-green-500/10 border-green-500/30 text-green-400"
        )}>
          <div className="flex items-center gap-2 font-bold mb-1">
            <Database className="w-3.5 h-3.5" />
            {isMockMode ? "DEMO MODE" : "LIVE MODE"}
          </div>
          <p className="text-zinc-400 mb-2">
            {isMockMode ? "Using mock data. No real DB connected." : "Connected to Supabase."}
          </p>
          <button
            onClick={toggleMockMode}
            className={cn(
              "w-full px-2 py-1 rounded text-xs font-semibold transition-all",
              isMockMode
                ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
            )}
          >
            {isMockMode ? "Switch to Live" : "Switch to Demo"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <motion.div
                key={item.href}
                whileHover={{ x: 4 }}
                whileTap={{ x: 2 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium",
                    isActive
                      ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                      : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-zinc-800 space-y-3">
          <div className="px-4 py-2 flex items-center gap-3">
            {sessionUser?.imageUrl ? (
              <span className="relative block h-8 w-8 overflow-hidden rounded-full">
                <Image
                  src={sessionUser.imageUrl}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </span>
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                <User2 className="w-4 h-4 text-zinc-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {sessionUser?.fullName || sessionUser?.email || "Admin User"}
              </p>
              <p className="text-xs text-zinc-500">{sessionUser?.role || "admin"}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 w-full">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
