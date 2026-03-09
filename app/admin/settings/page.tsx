"use client";
import { useDemoStore } from "@/lib/store";
import { Database, Key, Zap, ExternalLink } from "lucide-react";

export default function AdminSettings() {
  const { isMockMode, toggleMockMode } = useDemoStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black mb-1">Settings</h1>
        <p className="text-zinc-400 text-sm">Configure your store integrations</p>
      </div>

      {/* Demo Mode Card */}
      <div className={`p-6 rounded-2xl border ${isMockMode ? "bg-amber-500/10 border-amber-500/30" : "bg-green-500/10 border-green-500/30"}`}>
        <div className="flex items-center gap-3 mb-3">
          <Database className={`w-6 h-6 ${isMockMode ? "text-amber-400" : "text-green-400"}`} />
          <h2 className="font-bold text-lg">{isMockMode ? "Demo Mode Active" : "Live Mode Active"}</h2>
        </div>
        <p className="text-zinc-400 text-sm mb-4">
          {isMockMode
            ? "Currently using mock data (products.json + orders.json). No real database connected. Perfect for demos and development."
            : "Connected to real Supabase database. All changes persist."}
        </p>
        <button
          onClick={toggleMockMode}
          className={`px-6 py-2.5 font-bold rounded-xl transition-colors ${isMockMode ? "bg-amber-500 hover:bg-amber-400 text-black" : "bg-green-500 hover:bg-green-400 text-black"}`}
        >
          {isMockMode ? "Switch to Live Mode" : "Switch to Demo Mode"}
        </button>
      </div>

      <div className="space-y-4">
        {[
          { icon: Key, title: "Paystack Integration", sub: "Set your Paystack keys for M-Pesa and card payments", href: "https://dashboard.paystack.com" },
          { icon: Key, title: "Supabase Database", sub: "Connect your Supabase project for persistent data storage", href: "https://supabase.com/dashboard" },
          { icon: Zap, title: "Clerk Authentication", sub: "Enable user accounts and admin access control", href: "https://dashboard.clerk.com" },
        ].map((item) => (
          <div key={item.title} className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.sub}</p>
              </div>
            </div>
            <a href={item.href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium whitespace-nowrap">
              Configure <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>

      <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <h3 className="font-bold mb-3">Environment Variables</h3>
        <pre className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg overflow-x-auto">
{`# .env.local
USE_MOCK_DATA=true

# Switch to false + add these for live mode:
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_live_..."
PAYSTACK_SECRET_KEY="sk_live_..."`}
        </pre>
      </div>
    </div>
  );
}
