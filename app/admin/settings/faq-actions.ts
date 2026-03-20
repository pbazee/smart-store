"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { createFAQ, deleteFAQ, getFAQs, updateFAQ } from "@/lib/faq-service";
import type { FAQ } from "@/types";

const faqSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  answer: z.string().min(10, "Answer must be at least 10 characters"),
  order: z.number().optional(),
});

const faqUpdateSchema = z.object({
  question: z.string().min(5).optional(),
  answer: z.string().min(10).optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function revalidateFAQPaths() {
  revalidatePath("/admin/settings");
  revalidatePath("/faq");
  revalidatePath("/", "layout");
}

export async function fetchAdminFAQs() {
  await ensureAdmin();
  return getFAQs();
}

export async function createFAQAction(input: { question: string; answer: string; order?: number }) {
  await ensureAdmin();
  const data = faqSchema.parse(input);
  const faq = await createFAQ(data);
  revalidateFAQPaths();
  return faq;
}

export async function updateFAQAction(
  id: string,
  input: { question?: string; answer?: string; order?: number; isActive?: boolean }
) {
  await ensureAdmin();
  const data = faqUpdateSchema.parse(input);
  const faq = await updateFAQ(id, data);
  revalidateFAQPaths();
  return faq;
}

export async function deleteFAQAction(id: string) {
  await ensureAdmin();
  await deleteFAQ(id);
  revalidateFAQPaths();
  return { success: true };
}
