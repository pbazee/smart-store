"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { createFAQ, deleteFAQ, getFAQs, updateFAQ } from "@/lib/faq-service";
import type { FAQ } from "@/types";

const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  order: z.number().optional(),
});

const faqUpdateSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

async function checkAdmin(): Promise<{ ok: false; error: string } | { ok: true }> {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) return { ok: false, error: "Unauthorized. Please log in as admin." };
  return { ok: true };
}

function revalidateFAQPaths() {
  revalidatePath("/admin/settings");
  revalidatePath("/faq");
  revalidatePath("/", "layout");
}

export async function fetchAdminFAQs(): Promise<FAQ[]> {
  const auth = await checkAdmin();
  if (!auth.ok) return [];
  try {
    return await getFAQs();
  } catch (err) {
    console.error("[FAQ] fetchAdminFAQs failed:", err);
    return [];
  }
}

export async function createFAQAction(
  input: { question: string; answer: string; order?: number }
): Promise<FAQ> {
  const auth = await checkAdmin();
  if (!auth.ok) throw new Error(auth.error);

  let data: { question: string; answer: string; order?: number };
  try {
    data = faqSchema.parse(input);
  } catch (err: any) {
    const firstIssue = err?.errors?.[0];
    throw new Error(firstIssue?.message || "Invalid FAQ data.");
  }

  try {
    const faq = await createFAQ(data);
    revalidateFAQPaths();
    return faq;
  } catch (err: any) {
    console.error("[FAQ] createFAQ failed:", err?.message ?? err);
    throw new Error(err?.message || "Failed to create FAQ. Please try again.");
  }
}

export async function updateFAQAction(
  id: string,
  input: { question?: string; answer?: string; order?: number; isActive?: boolean }
): Promise<FAQ> {
  const auth = await checkAdmin();
  if (!auth.ok) throw new Error(auth.error);

  let data: typeof input;
  try {
    data = faqUpdateSchema.parse(input);
  } catch (err: any) {
    const firstIssue = err?.errors?.[0];
    throw new Error(firstIssue?.message || "Invalid FAQ data.");
  }

  try {
    const faq = await updateFAQ(id, data);
    revalidateFAQPaths();
    return faq;
  } catch (err: any) {
    console.error("[FAQ] updateFAQ failed:", err?.message ?? err);
    throw new Error(err?.message || "Failed to update FAQ. Please try again.");
  }
}

export async function deleteFAQAction(id: string): Promise<{ success: boolean }> {
  const auth = await checkAdmin();
  if (!auth.ok) throw new Error(auth.error);

  try {
    await deleteFAQ(id);
    revalidateFAQPaths();
    return { success: true };
  } catch (err: any) {
    console.error("[FAQ] deleteFAQ failed:", err?.message ?? err);
    throw new Error(err?.message || "Failed to delete FAQ. Please try again.");
  }
}
