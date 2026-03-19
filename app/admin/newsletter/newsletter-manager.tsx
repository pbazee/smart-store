"use client";

import { useState, useEffect } from "react";
import { Download, Mail, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import type { NewsletterSubscriber } from "@/types";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function downloadCsv(filename: string, rows: string[]) {
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function NewsletterManager({
  initialSubscribers,
  resendConfigured,
}: {
  initialSubscribers: NewsletterSubscriber[];
  resendConfigured: boolean;
}) {
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const exportSubscribers = () => {
    const rows = [
      "Email,Subscribed At",
      ...initialSubscribers.map((subscriber) =>
        [
          escapeCsv(subscriber.email),
          escapeCsv(new Date(subscriber.subscribedAt).toISOString()),
        ].join(",")
      ),
    ];

    downloadCsv("newsletter-subscribers.csv", rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Audience control
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Subscribers</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Track email signups from the footer and export the list for your campaigns.
          </p>
        </div>

        <button
          type="button"
          onClick={exportSubscribers}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total subscribers</p>
          <p className="mt-2 text-3xl font-black text-white">{initialSubscribers.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Most recent signup</p>
          <p className="mt-2 text-base font-semibold text-white">
            {initialSubscribers[0]
              ? new Date(initialSubscribers[0].subscribedAt).toLocaleString("en-KE", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
              : "No subscribers yet"}
          </p>
        </div>
      </div>

      {/* API Key Warning */}
      {!resendConfigured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Resend API key is missing</p>
              <p className="mt-1 text-sm text-amber-400/80">
                Add it in Vercel Environment Variables as <code className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-xs">RESEND_API_KEY</code>.
                Get your key from{" "}
                <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="underline hover:text-amber-300">
                  resend.com/api-keys
                </a>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <h2 className="flex items-center gap-3 text-xl font-black text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
            <Mail className="h-5 w-5" />
          </span>
          Send Newsletter
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          This will send an email to all {initialSubscribers.length} active subscribers.
        </p>

        {/* Send Result Feedback */}
        {sendResult && (
          <div className={`mt-4 rounded-xl border p-4 text-sm ${sendResult.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}>
            <div className="flex items-center gap-2">
              {sendResult.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span className="font-semibold">{sendResult.message}</span>
            </div>
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSendResult(null);
            setIsSending(true);

            const formData = new FormData(e.currentTarget);
            const subject = formData.get("subject") as string;
            const content = formData.get("content") as string;

            if (!subject || !content) {
              setIsSending(false);
              return;
            }

            try {
              const res = await (await import("./actions")).sendNewsletterAction({ subject, content });

              if (res.success) {
                setSendResult({
                  type: "success",
                  message: `Newsletter sent successfully to ${res.count} subscriber(s)!`,
                });
                (e.target as HTMLFormElement).reset();
              } else {
                const total = (res as any).totalSubscribers || 0;
                setSendResult({
                  type: "error",
                  message: res.error || `Sent to ${res.count}/${total} subscribers. Some emails failed.`,
                });
              }
            } catch (err: any) {
              console.error("[Newsletter UI] Send error:", err);
              setSendResult({
                type: "error",
                message: err?.message || "Failed to send newsletter. Check Vercel logs for details.",
              });
            } finally {
              setIsSending(false);
            }
          }}
          className="mt-6 space-y-4"
        >
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Subject</label>
            <input
              name="subject"
              required
              placeholder='e.g. New Drops: Premium Collection is Live!'
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-white outline-none focus:border-orange-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Message (HTML supported)</label>
            <textarea
              name="content"
              required
              rows={8}
              placeholder="Write your fire update here..."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-white outline-none focus:border-orange-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSending || !resendConfigured}
            className="w-full rounded-2xl bg-orange-500 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Blast Newsletter"
            )}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/70">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Email
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {initialSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-16 text-center text-zinc-400">
                    No subscribers yet.
                  </td>
                </tr>
              ) : (
                initialSubscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="border-b border-zinc-800/70 transition-colors hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300">
                          <Mail className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-zinc-100">{subscriber.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300">
                      {new Date(subscriber.subscribedAt).toLocaleString("en-KE", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
