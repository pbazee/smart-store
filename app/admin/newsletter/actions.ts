"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { getNewsletterSubscribers, subscribeToNewsletter, sendNewsletter, isResendConfigured } from "@/lib/newsletter-service";

const newsletterSubscriptionSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

const newsletterSendSchema = z.object({
  subject: z.string().min(5),
  content: z.string().min(20),
});

async function ensureAdmin() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

function revalidateNewsletterPaths() {
  revalidatePath("/admin/newsletter");
  revalidatePath("/", "layout");
}

export async function subscribeNewsletterAction(input: { email: string }) {
  const data = newsletterSubscriptionSchema.parse(input);
  const subscriber = await subscribeToNewsletter(data.email);

  revalidateNewsletterPaths();
  return subscriber;
}

export async function fetchAdminNewsletterSubscribers() {
  await ensureAdmin();
  return getNewsletterSubscribers();
}

export async function checkResendKeyAction() {
  return { configured: isResendConfigured() };
}

export async function sendNewsletterAction(input: { subject: string; content: string }) {
  await ensureAdmin();
  const data = newsletterSendSchema.parse(input);

  try {
    const result = await sendNewsletter(data.subject, data.content);
    return result;
  } catch (err: any) {
    console.error("[Newsletter Action] Unexpected error:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while sending the newsletter.",
      count: 0,
    };
  }
}
