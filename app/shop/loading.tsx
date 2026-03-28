export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      {/* Heading + sort bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded-full bg-muted/60" />
          <div className="h-4 w-20 rounded-full bg-muted/40" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-48 rounded-full bg-muted/60" />
          <div className="h-10 w-24 rounded-full bg-muted/60 lg:hidden" />
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar skeleton — desktop only */}
        <div className="hidden w-72 flex-shrink-0 space-y-3 lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/50" />
          ))}
        </div>

        {/* Product grid skeleton */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-[3/4] rounded-2xl bg-muted/50" />
                <div className="h-4 w-3/4 rounded-full bg-muted/40" />
                <div className="h-4 w-1/2 rounded-full bg-muted/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
