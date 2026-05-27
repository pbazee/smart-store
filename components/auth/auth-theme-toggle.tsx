"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function AuthThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/35 p-1 text-zinc-200 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:border-orange-400/40 hover:bg-black/50"
    >
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
          !isDark ? "bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.32)]" : ""
        }`}
      >
        <Sun className="h-4 w-4" />
      </span>
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
          isDark ? "bg-zinc-800 text-white" : "text-zinc-500"
        }`}
      >
        <Moon className="h-4 w-4" />
      </span>
    </button>
  );
}
