export default function Loading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="h-32 w-full animate-pulse rounded-3xl bg-zinc-900" />
                <div className="h-32 w-full animate-pulse rounded-3xl bg-zinc-900" />
                <div className="h-32 w-full animate-pulse rounded-3xl bg-zinc-900" />
                <div className="h-32 w-full animate-pulse rounded-3xl bg-zinc-900" />
            </div>
            <div className="grid gap-8 lg:grid-cols-[1fr,340px]">
                <div className="h-80 w-full animate-pulse rounded-3xl bg-zinc-900" />
                <div className="space-y-6">
                    <div className="h-40 w-full animate-pulse rounded-3xl bg-zinc-900" />
                    <div className="h-60 w-full animate-pulse rounded-3xl bg-zinc-900" />
                </div>
            </div>
            <div className="h-96 w-full animate-pulse rounded-3xl bg-zinc-900" />
        </div>
    );
}