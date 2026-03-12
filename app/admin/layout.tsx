"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Database,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  NotebookText,
  Package,
  Settings,
  ShoppingCart,
  TicketPercent,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionUser } from "@/hooks/use-session-user";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/announcements", label: "Announcements", icon: Bell },
  { href: "/admin/homepage-categories", label: "Homepage Categories", icon: LayoutGrid },
  { href: "/admin/blogs", label: "Blogs", icon: NotebookText },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessionUser, signOut } = useSessionUser();
  const isMockMode = shouldUseMockData();

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="w-64 border-r border-zinc-800 flex flex-col fixed h-full">
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-brand-500 rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-xs">SK</span>
            </div>
            <span className="font-bold text-sm">Smartest Store KE</span>
          </div>
          <p className="text-xs text-zinc-500">Admin Panel</p>
        </div>

        <div
          className={cn(
            "mx-3 mt-3 p-3 rounded-xl border text-xs",
            isMockMode
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-green-500/10 border-green-500/30 text-green-400"
          )}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            <Database className="w-3.5 h-3.5" />
            {isMockMode ? "DEMO MODE" : "LIVE MODE"}
          </div>
          <p className="text-zinc-400 mb-2">
            {isMockMode ? "Using mock data. No real DB connected." : "Connected to Supabase."}
          </p>
          <p className="text-[11px] text-zinc-500">
            Controlled by <code>USE_MOCK_DATA</code> in the environment.
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-brand-500 text-white"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800 space-y-3">
          <div className="px-4 py-2">
            <p className="text-sm font-semibold text-zinc-100">
              {sessionUser?.fullName || sessionUser?.email || "Admin session"}
            </p>
            <p className="text-xs text-zinc-500">
              {sessionUser?.email || "Manage the storefront"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void signOut().then(() => {
                router.push("/");
                router.refresh();
              });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Store
          </Link>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-h-screen">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8">
          {children}
        </motion.div>
      </main>
    </div>
  );
}
