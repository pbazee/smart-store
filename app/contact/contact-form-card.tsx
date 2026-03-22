"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useToast } from "@/lib/use-toast";

const SUBJECT_OPTIONS = [
  "General Inquiry",
  "Order Support",
  "Product Question",
  "Return Request",
  "Partnership",
  "Other",
];

type ContactFormState = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
};

const initialFormState: ContactFormState = {
  firstName: "",
  lastName: "",
  email: "",
  subject: SUBJECT_OPTIONS[0],
  message: "",
};

export function ContactFormCard({ supportEmail }: { supportEmail: string }) {
  const { toast } = useToast();
  const [form, setForm] = useState<ContactFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ").trim();
    if (!name) {
      toast({
        title: "Name required",
        description: "Please add your first or last name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message.");
      }

      setForm(initialFormState);
      toast({
        title: "Message sent",
        description: "Your message is in the support inbox. The team will get back to you shortly.",
      });
    } catch (error) {
      toast({
        title: "Message failed",
        description:
          error instanceof Error ? error.message : "Failed to send message.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-border bg-card p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <h2 className="text-2xl font-black text-zinc-950 dark:text-zinc-50">Send Us a Message</h2>
      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        Prefer email? Send the essentials and our support team will reply from{" "}
        <span className="font-semibold text-zinc-950 dark:text-zinc-100">{supportEmail}</span>.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              First Name
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({ ...current, firstName: event.target.value }))
              }
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-border dark:bg-background dark:text-zinc-100"
              placeholder="John"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Last Name
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(event) =>
                setForm((current) => ({ ...current, lastName: event.target.value }))
              }
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-border dark:bg-background dark:text-zinc-100"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-border dark:bg-background dark:text-zinc-100"
            placeholder="john@email.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Subject
          </label>
          <select
            value={form.subject}
            onChange={(event) =>
              setForm((current) => ({ ...current, subject: event.target.value }))
            }
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-border dark:bg-background dark:text-zinc-100"
          >
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Message
          </label>
          <textarea
            rows={6}
            required
            value={form.message}
            onChange={(event) =>
              setForm((current) => ({ ...current, message: event.target.value }))
            }
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-border dark:bg-background dark:text-zinc-100"
            placeholder="How can we help you?"
          />
        </div>

        <div className="rounded-[1.5rem] bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-muted/50 dark:text-muted-foreground">
          Support replies come from{" "}
          <span className="font-semibold text-zinc-950 dark:text-foreground">{supportEmail}</span>. Include
          your order number when the message is about delivery, payment, or returns so the
          team can help faster.
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </form>

      <p className="mt-6 text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-muted-foreground">
        Looking for quick answers?{" "}
        <Link href="/faq" className="font-semibold text-brand-500 hover:text-brand-600">
          Browse the FAQ
        </Link>
      </p>
    </div>
  );
}
