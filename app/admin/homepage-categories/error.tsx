"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminHomepageCategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminHomepageCategories] Route error:", error);
  }, [error]);

  return (
    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-8 text-zinc-100">
      <div className="flex max-w-2xl flex-col gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-300">
            Homepage categories
          </p>
          <h1 className="text-3xl font-black text-white">
            This admin section is temporarily unavailable.
          </h1>
          <p className="text-sm leading-7 text-zinc-400">
            The page hit a backend error, but the rest of the admin panel is still intact. Try
            reloading this section and we will reconnect to the latest data.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
