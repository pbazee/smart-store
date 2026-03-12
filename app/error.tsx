"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service in production
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-black mb-2">Oops! Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try again.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="bg-muted p-4 rounded-lg mb-6 text-left text-xs font-mono text-red-600 dark:text-red-400 overflow-auto max-h-40">
            <p className="font-bold mb-2">Error Details:</p>
            <p>{error.message}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full px-6 py-3 border border-border hover:bg-muted text-foreground font-semibold rounded-lg transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
