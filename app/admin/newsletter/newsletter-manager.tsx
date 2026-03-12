"use client";

import { Download, Mail } from "lucide-react";
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
}: {
  initialSubscribers: NewsletterSubscriber[];
}) {
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
