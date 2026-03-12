"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  LayoutGrid,
  NotebookText,
  Package,
  ShoppingCart,
  Settings,
  Database,
  ArrowLeft,
  LogOut,
  TicketPercent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useDemoStore } from "@/lib/store";
import { UserButton } from "@clerk/nextjs";

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

export default function AdminLayoutProtected({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isMockMode, toggleMockMode } = useDemoStore();

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
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
          <div className="px-4 py-2">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                }
              }}
            />
          </div>
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
