"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Save, X, GripVertical } from "lucide-react";
import {
  createFAQAction,
  deleteFAQAction,
  updateFAQAction,
} from "@/app/admin/settings/faq-actions";
import { useToast } from "@/lib/use-toast";
import type { FAQ } from "@/types";

export function FAQManager({ initialFAQs }: { initialFAQs: FAQ[] }) {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>(initialFAQs);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ question: "", answer: "" });

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({ question: "", answer: "" });
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({ question: faq.question, answer: faq.answer });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ question: "", answer: "" });
  };

  const handleSaveNew = () => {
    if (!formData.question.trim() || !formData.answer.trim()) return;

    startTransition(() => {
      void (async () => {
        try {
          const newFAQ = await createFAQAction({
            question: formData.question,
            answer: formData.answer,
          });
          setFaqs((prev) => [...prev, newFAQ]);
          setIsCreating(false);
          setFormData({ question: "", answer: "" });
          toast({ title: "FAQ created" });
        } catch (error) {
          toast({
            title: "Failed to create FAQ",
            variant: "destructive",
          });
        }
      })();
    });
  };

  const handleUpdate = (id: string) => {
    if (!formData.question.trim() || !formData.answer.trim()) return;

    startTransition(() => {
      void (async () => {
        try {
          const updated = await updateFAQAction(id, {
            question: formData.question,
            answer: formData.answer,
          });
          setFaqs((prev) =>
            prev.map((f) => (f.id === id ? updated : f))
          );
          setEditingId(null);
          setFormData({ question: "", answer: "" });
          toast({ title: "FAQ updated" });
        } catch (error) {
          toast({
            title: "Failed to update FAQ",
            variant: "destructive",
          });
        }
      })();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    startTransition(() => {
      void (async () => {
        try {
          await deleteFAQAction(id);
          setFaqs((prev) => prev.filter((f) => f.id !== id));
          toast({ title: "FAQ deleted" });
        } catch (error) {
          toast({
            title: "Failed to delete FAQ",
            variant: "destructive",
          });
        }
      })();
    });
  };

  const handleToggleActive = (faq: FAQ) => {
    startTransition(() => {
      void (async () => {
        try {
          const updated = await updateFAQAction(faq.id, {
            isActive: !faq.isActive,
          });
          setFaqs((prev) =>
            prev.map((f) => (f.id === faq.id ? updated : f))
          );
          toast({ title: updated.isActive ? "FAQ activated" : "FAQ deactivated" });
        } catch (error) {
          toast({
            title: "Failed to update FAQ",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">FAQ Management</h2>
          <p className="text-sm text-zinc-400">
            Manage frequently asked questions displayed on the FAQ page.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating || isPending}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Add FAQ
        </button>
      </div>

      {isCreating && (
        <div className="rounded-[1.5rem] border border-zinc-700 bg-zinc-800/50 p-5">
          <div className="space-y-3">
            <input
              value={formData.question}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, question: e.target.value }))
              }
              placeholder="Question"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
            />
            <textarea
              value={formData.answer}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, answer: e.target.value }))
              }
              placeholder="Answer"
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNew}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-300"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {faqs.length === 0 ? (
          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
            No FAQs yet. Click "Add FAQ" to create one.
          </div>
        ) : (
          faqs.map((faq) => (
            <div
              key={faq.id}
              className={`rounded-[1.5rem] border p-5 transition ${
                faq.isActive
                  ? "border-zinc-800 bg-zinc-900"
                  : "border-zinc-800/50 bg-zinc-900/50 opacity-60"
              }`}
            >
              {editingId === faq.id ? (
                <div className="space-y-3">
                  <input
                    value={formData.question}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        question: e.target.value,
                      }))
                    }
                    placeholder="Question"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
                  />
                  <textarea
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        answer: e.target.value,
                      }))
                    }
                    placeholder="Answer"
                    rows={3}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(faq.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-300"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={faq.isActive}
                      onChange={() => handleToggleActive(faq)}
                      className="h-5 w-5 rounded border-zinc-600 bg-zinc-800 text-brand-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{faq.question}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{faq.answer}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
