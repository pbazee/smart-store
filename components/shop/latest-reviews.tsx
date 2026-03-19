"use client";

import { motion } from "framer-motion";
import { Star, MessageCircle, ArrowRight } from "lucide-react";
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

export function LatestReviews({ reviews }: { reviews: ReviewWithProduct[] }) {
    if (reviews.length === 0) return null;

    return (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col items-center justify-between gap-6 sm:flex-row">
                <div className="text-center sm:text-left">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">
                        Social Proof
                    </p>
                    <h2 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-5xl">
                        Latest customer stories
                    </h2>
                    <p className="mt-4 max-w-lg text-lg text-muted-foreground">
                        Real feedback from our community across Kenya.
                    </p>
                </div>
                <Link
                    href="/reviews"
                    className="group inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-bold uppercase tracking-wider text-foreground transition-all hover:border-orange-500/50 hover:bg-orange-500/5 hover:text-orange-600"
                >
                    View all reviews
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review, index) => (
                    <motion.article
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:border-orange-500/20 hover:shadow-md"
                    >
                        <div className="mb-4 flex items-center justify-between">
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
                            <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString("en-KE", {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </time>
                        </div>

                        <h3 className="line-clamp-1 font-bold">{review.title || "Incredible find"}</h3>
                        <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                            &ldquo;{review.content}&rdquo;
                        </p>

                        <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-black text-orange-600 dark:bg-orange-950/30">
                                {review.authorName[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">{review.authorName}</p>
                                <div className="mt-1 flex items-center gap-1.5 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <span className="text-orange-500">Verified</span>
                                    <span className="h-1 w-1 rounded-full bg-border" />
                                    <span>{review.authorCity || "Nairobi"}</span>
                                </div>
                            </div>
                        </div>

                        <Link
                            href={`/product/${review.product.slug}`}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 transition-colors hover:text-orange-700"
                        >
                            <MessageCircle className="h-3 w-3" />
                            Regarding {review.product.name}
                        </Link>
                    </motion.article>
                ))}
            </div>
        </section>
    );
}
