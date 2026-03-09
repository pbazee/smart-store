"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Settings, Database, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useDemoStore } from "@/lib/store";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
              "w-full py-1.5 rounded-lg font-semibold text-xs transition-colors",
              isMockMode
                ? "bg-amber-500 hover:bg-amber-400 text-black"
                : "bg-green-500 hover:bg-green-400 text-black"
            )}
          >
            {isMockMode ? "→ Connect Real DB" : "← Switch to Demo"}
          </button>
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

        <div className="p-3 border-t border-zinc-800">
          <Link href="/" className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
