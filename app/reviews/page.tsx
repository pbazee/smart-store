import { getLatestApprovedReviews } from "@/lib/reviews-service";
import { Star, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ReviewWithProduct = {
    id: string;
    authorName: string;
    authorCity?: string | null;
    rating: number;
    title?: string | null;
    content: string;
    createdAt: string | Date;
    product: {
        name: string;
        slug: string;
    };
};

export const revalidate = 60;

export default async function ReviewsPage() {
    const reviews = await getLatestApprovedReviews(50) as unknown as ReviewWithProduct[];

    return (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">
                    Community Feedback
                </p>
                <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-6xl">
                    What shooters are saying
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                    Real stories from the Smartest Store KE community. Filtered by quality,
                    driven by the culture.
                </p>
            </div>

            {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 text-xl font-medium text-muted-foreground">
                        No reviews yet. Be the first to drop one!
                    </p>
                </div>
            ) : (
                <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="mb-6 break-inside-avoid rounded-[2.5rem] border border-border/60 bg-card p-8 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
                        >
                            <div className="mb-6 flex items-center justify-between">
                                <MessageCircle className="h-8 w-8 text-orange-500/20" />
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "h-4 w-4",
                                                i < review.rating ? "fill-orange-400 text-orange-400" : "fill-muted text-muted"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold leading-tight">{review.title || "Elite selection"}</h3>
                            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                                &ldquo;{review.content}&rdquo;
                            </p>

                            <div className="mt-8 flex items-center gap-4 border-t border-border/40 pt-8">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-black text-orange-600 dark:bg-orange-950/40">
                                    {review.authorName[0]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-bold">{review.authorName}</p>
                                    <div className="mt-1 flex items-center gap-1.5 truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        <span className="text-orange-500">Verified</span>
                                        <span className="h-1 w-1 rounded-full bg-border" />
                                        <span>{review.authorCity || "Nairobi"}</span>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/product/${review.product.slug}`}
                                className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-600 transition-colors hover:text-orange-700 underline-offset-4 hover:underline"
                            >
                                View {review.product.name}
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-20 rounded-[3rem] bg-zinc-950 p-10 text-center text-white lg:p-20">
                <h2 className="font-display text-3xl font-black sm:text-5xl">Ready to join the crew?</h2>
                <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
                    Grab your fire pieces and share your story with the community.
                </p>
                <div className="mt-10">
                    <Link
                        href="/shop"
                        className="inline-flex h-14 items-center justify-center rounded-full bg-orange-500 px-10 text-base font-bold text-white shadow-[0_20px_50px_rgba(249,115,22,0.3)] transition-all hover:scale-105 hover:bg-orange-600"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
