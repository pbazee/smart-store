"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import type { ProductReview } from "@/types";
import { useSessionUser } from "@/hooks/use-session-user";
import { useToast } from "@/lib/use-toast";
import { cn } from "@/lib/utils";

type ReviewsPanelProps = {
  productId: string;
  initialReviews: ProductReview[];
  averageRating: number;
};

export function ReviewsPanel({
  productId,
  initialReviews,
  averageRating,
}: ReviewsPanelProps) {
  const router = useRouter();
  const { sessionUser } = useSessionUser();
  const { toast } = useToast();
  const [reviews, setReviews] = useState(initialReviews);
  const [form, setForm] = useState({
    authorName: sessionUser?.fullName || "",
    authorCity: "Nairobi",
    rating: 5,
    title: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      authorName: sessionUser?.fullName || current.authorName,
    }));
  }, [sessionUser]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sessionUser) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          authorName: form.authorName,
          authorCity: form.authorCity,
          rating: form.rating,
          title: form.title,
          content: form.content,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save review");
      }

      setReviews((current) => [payload.data, ...current]);
      setForm((current) => ({
        ...current,
        title: "",
        content: "",
        rating: 5,
      }));
      toast({
        title: "Review saved",
        description: "Your feedback is now part of the product story.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Review failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-20 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
      <div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-500">
            Customer Reviews
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="text-5xl font-black">{averageRating.toFixed(1)}</div>
            <div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "h-5 w-5",
                      index < Math.round(averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted text-muted"
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Verified stories from Nairobi shoppers.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {reviews.slice(0, 5).map((review) => (
            <article key={review.id} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{review.title || "Loved this drop"}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.authorName}
                    {review.authorCity ? `, ${review.authorCity}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        "h-4 w-4",
                        index < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-muted text-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {review.content}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h3 className="text-xl font-black">Add your review</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Share sizing, delivery, and quality notes to help the next shopper choose faster.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Your name</span>
              <input
                value={form.authorName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, authorName: event.target.value }))
                }
                className="w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">City</span>
              <input
                value={form.authorCity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, authorCity: event.target.value }))
                }
                className="w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Headline</span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Rating</span>
            <select
              value={form.rating}
              onChange={(event) =>
                setForm((current) => ({ ...current, rating: Number(event.target.value) }))
              }
              className="w-full rounded-2xl border border-border bg-background px-4 py-3"
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} star{rating === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Review</span>
            <textarea
              rows={5}
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({ ...current, content: event.target.value }))
              }
              className="w-full rounded-2xl border border-border bg-background px-4 py-3"
              placeholder="Tell us about fit, quality, delivery, and why you would recommend it."
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting ? "Saving review..." : "Publish review"}
          </button>
        </form>
      </div>
    </section>
  );
}
