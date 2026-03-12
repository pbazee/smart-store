"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { subscribeNewsletterAction } from "@/app/admin/newsletter/actions";
import { useToast } from "@/lib/use-toast";

export function FooterNewsletterForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          await subscribeNewsletterAction({ email });
          setEmail("");
          toast({
            title: "You're now part of the family! 🎉",
            description: "Fresh drops, popups, and style notes will land in your inbox.",
          });
        } catch (error) {
          toast({
            title: "Subscription failed",
            description:
              error instanceof Error ? error.message : "Please enter a valid email address.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-semibold text-white">Join the newsletter</label>
      <p className="text-sm text-zinc-400">
        Get launch alerts, limited coupons, and weekly style edits from Nairobi.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-12 flex-1 rounded-full border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-100 outline-none transition-colors focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {isPending ? "Subscribing..." : "Subscribe"}
        </button>
      </div>
    </form>
  );
}
