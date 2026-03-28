export default function ProductPageLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:gap-16">
        <div className="space-y-4">
          <div className="aspect-square animate-pulse rounded-[2rem] bg-muted" />
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-12 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-5 w-56 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
          <div className="rounded-[1.75rem] border border-border bg-card p-5">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-4 flex gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-11 w-11 animate-pulse rounded-full bg-muted" />
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr,auto]">
            <div className="h-16 animate-pulse rounded-[1.35rem] bg-muted" />
            <div className="h-16 animate-pulse rounded-[1.35rem] bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
