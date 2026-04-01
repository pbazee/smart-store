export default function AdminHomepageCategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="h-3 w-32 rounded-full bg-zinc-800" />
          <div className="h-10 w-72 rounded-full bg-zinc-800" />
          <div className="h-5 w-[30rem] max-w-full rounded-full bg-zinc-900" />
        </div>
        <div className="h-12 w-48 rounded-full bg-zinc-800" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
            <div className="h-4 w-32 rounded-full bg-zinc-800" />
            <div className="mt-4 h-10 w-20 rounded-full bg-zinc-800" />
          </div>
        ))}
      </div>

      <div className="h-12 w-full rounded-full bg-zinc-900" />

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-900">
        <div className="space-y-4 p-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[4rem,minmax(0,1fr),8rem,1fr,6rem,5rem,6rem] gap-4">
              <div className="h-16 w-12 rounded-2xl bg-zinc-800" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded-full bg-zinc-800" />
                <div className="h-3 w-60 rounded-full bg-zinc-900" />
              </div>
              <div className="h-4 w-24 rounded-full bg-zinc-800" />
              <div className="h-4 w-full rounded-full bg-zinc-900" />
              <div className="h-6 w-20 rounded-full bg-zinc-800" />
              <div className="h-4 w-10 rounded-full bg-zinc-800" />
              <div className="h-10 w-24 rounded-2xl bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
