import { Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-orange-500" />
        </div>
        <h1 className="text-5xl font-black mb-2">404</h1>
        <p className="text-2xl font-bold mb-2">Page Not Found</p>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/shop"
            className="w-full px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors"
          >
            Browse Products
          </Link>
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
