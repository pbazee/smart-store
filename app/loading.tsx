export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[340px] w-full bg-muted/50 sm:h-[420px] lg:h-[520px]" />

      {/* Promo cards skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/50" />
          ))}
        </div>
      </div>

      {/* Category grid skeleton */}
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-4 h-7 w-40 rounded-full bg-muted/50" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted/50" />
          ))}
        </div>
      </div>

      {/* Product sections skeleton */}
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-4 h-7 w-48 rounded-full bg-muted/50" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[3/4] rounded-2xl bg-muted/50" />
              <div className="h-4 w-3/4 rounded-full bg-muted/50" />
              <div className="h-4 w-1/2 rounded-full bg-muted/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
