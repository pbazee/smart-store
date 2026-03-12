export function BlogTeaserSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
        <div className="mt-4 h-10 w-80 max-w-full animate-pulse rounded-full bg-muted" />
        <div className="mt-3 h-5 w-[32rem] max-w-full animate-pulse rounded-full bg-muted/80" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-[2rem] border border-border bg-card">
            <div className="h-56 animate-pulse bg-muted" />
            <div className="space-y-3 p-6">
              <div className="h-3 w-32 animate-pulse rounded-full bg-muted/70" />
              <div className="h-7 w-full animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-full animate-pulse rounded-full bg-muted/80" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted/80" />
              <div className="h-4 w-24 animate-pulse rounded-full bg-brand-500/30" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
