export function ProductRecommendationsSkeleton() {
  return (
    <div className="mt-20 space-y-16">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <section key={sectionIndex}>
          <div className="mb-8 space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-72 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
