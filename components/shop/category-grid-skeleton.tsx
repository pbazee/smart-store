export function CategoryGridSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="mx-auto h-10 w-72 animate-pulse rounded-full bg-muted" />
        <div className="mx-auto mt-3 h-5 w-96 max-w-full animate-pulse rounded-full bg-muted/80" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>

      <div className="mt-6 flex justify-center sm:justify-end">
        <div className="h-12 w-56 animate-pulse rounded-full bg-brand-500/30" />
      </div>
    </section>
  );
}
