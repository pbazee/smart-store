"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { getNewsletterSubscribers, subscribeToNewsletter, sendNewsletter, isResendConfigured } from "@/lib/newsletter-service";

const newsletterSubscriptionSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

const newsletterSendSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
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
  try {
    const data = newsletterSubscriptionSchema.parse(input);
    const subscriber = await subscribeToNewsletter(data.email);
    revalidateNewsletterPaths();
    return { success: true, subscriber };
  } catch (err: any) {
    if (err?.errors) {
      return { success: false, error: err.errors[0]?.message || "Invalid email address." };
    }
    return { success: false, error: err?.message || "Failed to subscribe. Please try again." };
  }
}

export async function fetchAdminNewsletterSubscribers() {
  await ensureAdmin();
  return getNewsletterSubscribers();
}

export async function checkResendKeyAction() {
  return { configured: isResendConfigured() };
}

export async function sendNewsletterAction(input: { subject: string; content: string }) {
  try {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized. Please log in as admin.", count: 0 };
    }

    let data: { subject: string; content: string };
    try {
      data = newsletterSendSchema.parse(input);
    } catch (err: any) {
      const firstIssue = err?.errors?.[0];
      return {
        success: false,
        error: firstIssue?.message || "Please fill in both subject and message fields.",
        count: 0,
      };
    }

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
