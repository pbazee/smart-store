"use client";

import { useState } from "react";
import {
    CheckCircle,
    Trash2,
    Star,
    Search,
    Filter,
    MessageCircle,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/use-toast";
import { cn } from "@/lib/utils";

type ReviewWithProduct = {
    id: string;
    authorName: string;
    authorCity?: string | null;
    rating: number;
    title?: string | null;
    content: string;
    isApproved: boolean;
    createdAt: string | Date;
    product: {
        name: string;
        slug: string;
    };
};

export function ReviewsManager({ initialReviews }: { initialReviews: ReviewWithProduct[] }) {
    const [reviews, setReviews] = useState(initialReviews);
    const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
    const [search, setSearch] = useState("");
    const { toast } = useToast();

    const filteredReviews = reviews.filter(review => {
        const matchesFilter =
            filter === "all" ? true :
                filter === "approved" ? review.isApproved :
                    !review.isApproved;

        const matchesSearch =
            review.authorName.toLowerCase().includes(search.toLowerCase()) ||
            review.content.toLowerCase().includes(search.toLowerCase()) ||
            review.product.name.toLowerCase().includes(search.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const handleApprove = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/reviews/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: true }),
            });

            if (!response.ok) throw new Error("Approval failed");

            setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
            toast({ title: "Review approved", description: "It is now live on the site." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to approve review.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;

        try {
            const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });

            if (!response.ok) throw new Error("Deletion failed");

            setReviews(prev => prev.filter(r => r.id !== id));
            toast({ title: "Review deleted", description: "The review has been removed." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete review.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search reviews, authors, or products..."
                        className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                    >
                        <option value="all">All Reviews</option>
                        <option value="pending">Pending Only</option>
                        <option value="approved">Approved Only</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredReviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20 text-center">
                        <MessageCircle className="h-10 w-10 text-muted-foreground/40" />
                        <p className="mt-4 font-medium text-muted-foreground">No reviews found matching your criteria.</p>
                    </div>
                ) : (
                    filteredReviews.map((review) => (
                        <div
                            key={review.id}
                            className={cn(
                                "group relative overflow-hidden rounded-3xl border bg-card transition-all hover:shadow-md",
                                review.isApproved ? "border-border/60" : "border-orange-500/30 bg-orange-500/[0.02]"
                            )}
                        >
                            {!review.isApproved && (
                                <div className="absolute left-0 top-0 flex h-full w-1 items-center bg-orange-500" />
                            )}

                            <div className="p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg">{review.title || "No Title"}</h3>
                                            {!review.isApproved && (
                                                <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-orange-600">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                                            &ldquo;{review.content}&rdquo;
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {!review.isApproved && (
                                            <button
                                                onClick={() => handleApprove(review.id)}
                                                className="flex h-9 items-center gap-2 rounded-xl bg-green-500 px-4 text-xs font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-600 active:scale-95"
                                            >
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/40 pt-6">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "fill-orange-400 text-orange-400" : "fill-muted text-muted")} />
                                        ))}
                                    </div>

                                    <div className="text-xs font-semibold text-muted-foreground">
                                        By <span className="text-foreground">{review.authorName}</span> from {review.authorCity || "Unknown"}
                                    </div>

                                    <div className="text-xs font-semibold text-muted-foreground">
                                        Product: <Link href={`/product/${review.product.slug}`} target="_blank" className="text-orange-600 hover:underline">{review.product.name}</Link>
                                    </div>

                                    <div className="text-xs font-semibold text-muted-foreground">
                                        {new Date(review.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
