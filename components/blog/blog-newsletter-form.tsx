"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletterAction } from "@/app/admin/newsletter/actions";
import { RippleSpinner } from "@/components/ui/ripple-loader";
import { useToast } from "@/lib/use-toast";

export function BlogNewsletterForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        const result = await subscribeNewsletterAction({ email });

        if (result.success) {
          setEmail("");
          toast({
            title: "Subscribed",
            description: "Style updates will land in your inbox.",
          });
          return;
        }

        toast({
          title: "Subscription failed",
          description: result.error || "Please enter a valid email address.",
          variant: "destructive",
        });
      })();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="h-12 min-w-0 rounded-full border border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-zinc-400 outline-none focus:border-orange-400"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-500 px-6 text-sm font-black text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending ? <RippleSpinner size={24} color="currentColor" label="Subscribing" /> : null}
        {isPending ? "Subscribing..." : "Subscribe"}
      </button>
    </form>
  );
}
