export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Heading skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded-full bg-muted/70" />
        </div>
        <div className="flex items-center gap-3 self-start">
          <div className="h-10 w-44 animate-pulse rounded-full bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded-full bg-muted lg:hidden" />
        </div>
      </div>

      {/* Grid skeleton — matches 2-col mobile / 3-col md+ layout */}
      <div className="flex gap-8">
        {/* Sidebar placeholder (hidden on mobile) */}
        <div className="hidden w-72 flex-shrink-0 lg:block">
          <div className="space-y-4 rounded-[2rem] border border-border bg-card p-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-5 animate-pulse rounded-full bg-muted" style={{ width: `${70 - i * 8}%` }} />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                {/* Image */}
                <div className="aspect-square w-full animate-pulse rounded-[1.5rem] bg-muted" />
                {/* Title */}
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted/70" />
                {/* Price */}
                <div className="h-5 w-1/3 animate-pulse rounded-full bg-muted" />
                {/* Button */}
                <div className="h-10 w-full animate-pulse rounded-[1rem] bg-muted/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
