"use client";

export function StatCardSkeleton() {
  return (
    <div className="h-32 w-full animate-pulse rounded-2xl bg-zinc-900 border border-zinc-800" />
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-[300px] w-full animate-pulse rounded-2xl bg-zinc-900 border border-zinc-800" />
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-900" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-zinc-900/50" />
      ))}
    </div>
  );
}
