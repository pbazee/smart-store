export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 sm:p-8">
          <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
          <div className="mt-4 h-10 w-72 max-w-full animate-pulse rounded-full bg-muted" />
          <div className="mt-3 h-5 w-[34rem] max-w-full animate-pulse rounded-full bg-muted/80" />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-[1.5rem] bg-muted/70"
              />
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[1.75rem] border border-border bg-card"
            >
              <div className="aspect-[3/4] animate-pulse bg-muted" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted/80" />
                <div className="h-10 animate-pulse rounded-xl bg-brand-500/20" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
