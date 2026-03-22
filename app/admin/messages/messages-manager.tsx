"use client";

import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import {
  Clock3,
  Loader2,
  Mail,
  MessageCircleMore,
  Search,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/use-toast";
import type { ContactMessage } from "@/types";

const PAGE_SIZE = 10;

function previewMessage(message: string) {
  return message.length > 90 ? `${message.slice(0, 90)}...` : message;
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessagesManager({
  initialMessages,
}: {
  initialMessages: ContactMessage[];
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "replied">("all");
  const [page, setPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const filteredMessages = useMemo(() => {
    return [...messages]
      .filter((message) => {
        const matchesFilter =
          statusFilter === "all" ? true : message.status === statusFilter;
        const matchesSearch =
          !deferredSearch.trim() ||
          [message.name, message.email, message.subject, message.message]
            .join(" ")
            .toLowerCase()
            .includes(deferredSearch.trim().toLowerCase());

        return matchesFilter && matchesSearch;
      })
      .sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === "unread" ? -1 : 1;
        }

        return (
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
      });
  }, [deferredSearch, messages, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const unreadCount = messages.filter((message) => message.status === "unread").length;

  const handleOpenMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setReplyMessage("");
  };

  const handleReply = () => {
    if (!selectedMessage) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/admin/messages/${selectedMessage.id}/reply`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ replyMessage }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || "Failed to send reply.");
          }

          const updatedMessage = result.message as ContactMessage;
          setMessages((current) =>
            current.map((message) =>
              message.id === updatedMessage.id ? updatedMessage : message
            )
          );
          setSelectedMessage(updatedMessage);
          setReplyMessage("");
          toast({
            title: "Reply sent",
            description: `A reply was sent to ${updatedMessage.email}.`,
          });
        } catch (error) {
          toast({
            title: "Reply failed",
            description:
              error instanceof Error ? error.message : "Failed to send reply.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Support inbox
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Messages</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Review contact-form submissions, reply from the admin panel, and keep support organized.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Inbox size</p>
          <p className="mt-2 text-3xl font-black text-white">{messages.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Unread</p>
          <p className="mt-2 text-3xl font-black text-orange-400">{unreadCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Visible results</p>
          <p className="mt-2 text-3xl font-black text-white">{filteredMessages.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by sender, email, subject, or message"
            className="h-12 w-full rounded-full border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "unread", "replied"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                statusFilter === value
                  ? "bg-brand-500 text-white"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/70">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Sender
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Email
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Subject
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Message Preview
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedMessages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-400">
                    No messages match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedMessages.map((message) => (
                  <tr
                    key={message.id}
                    onClick={() => handleOpenMessage(message)}
                    className="cursor-pointer border-b border-zinc-800/70 transition-colors hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300">
                          <MessageCircleMore className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-zinc-100">{message.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300">
                      {message.email}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenMessage(message);
                        }}
                        className="text-left font-semibold text-zinc-100 transition-colors hover:text-brand-300"
                      >
                        {message.subject}
                      </button>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-400">
                      {previewMessage(message.message)}
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300">
                      {formatDate(message.createdAt)}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          message.status === "replied"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-orange-500/15 text-orange-300"
                        }`}
                      >
                        {message.status === "replied" ? "Replied" : "Unread"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Dialog
        open={!!selectedMessage}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMessage(null);
            setReplyMessage("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject || "Message details"}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Review the full message and reply directly from the admin panel.
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 rounded-[1.75rem] border border-zinc-800 bg-black/40 p-5 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Sender
                  </p>
                  <p className="mt-2 text-base font-semibold text-zinc-100">
                    {selectedMessage.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{selectedMessage.email}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Clock3 className="h-4 w-4 text-zinc-500" />
                    {formatDate(selectedMessage.createdAt)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Mail className="h-4 w-4 text-zinc-500" />
                    {selectedMessage.status === "replied" && selectedMessage.repliedAt
                      ? `Replied ${formatDate(selectedMessage.repliedAt)}`
                      : "Awaiting reply"}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Original message
                </p>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                  Reply
                </label>
                <textarea
                  rows={7}
                  value={replyMessage}
                  onChange={(event) => setReplyMessage(event.target.value)}
                  placeholder="Write your reply here..."
                  className="w-full rounded-[1.5rem] border border-zinc-800 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-brand-500/60"
                />
                <p className="text-xs text-zinc-500">
                  The email is sent to the customer and the message is marked as replied only after the send succeeds.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMessage(null);
                    setReplyMessage("");
                  }}
                  className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isPending || replyMessage.trim().length < 5}
                  onClick={handleReply}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isPending ? "Sending..." : "Send reply"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
