import { Resend } from "resend";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { NewsletterSubscriber } from "@/types";

/** Lazily initialize Resend only when actually sending */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new Resend(apiKey);
}

/** Check if Resend API key is configured */
export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

let demoNewsletterSubscribersState: NewsletterSubscriber[] = [];

function cloneSubscriber(subscriber: NewsletterSubscriber): NewsletterSubscriber {
  return {
    ...subscriber,
    subscribedAt:
      subscriber.subscribedAt instanceof Date
        ? new Date(subscriber.subscribedAt)
        : subscriber.subscribedAt,
  };
}

function sortSubscribers(subscribers: NewsletterSubscriber[]) {
  return [...subscribers].sort(
    (left, right) =>
      new Date(right.subscribedAt).getTime() - new Date(left.subscribedAt).getTime()
  );
}

export function normalizeNewsletterEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getDemoNewsletterSubscribers() {
  return sortSubscribers(demoNewsletterSubscribersState).map(cloneSubscriber);
}

export function subscribeDemoNewsletter(email: string) {
  const normalizedEmail = normalizeNewsletterEmail(email);
  const existingSubscriber = demoNewsletterSubscribersState.find(
    (subscriber) => subscriber.email === normalizedEmail
  );

  if (existingSubscriber) {
    return cloneSubscriber(existingSubscriber);
  }

  const nextSubscriber: NewsletterSubscriber = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    subscribedAt: new Date(),
  };

  demoNewsletterSubscribersState = sortSubscribers([
    nextSubscriber,
    ...demoNewsletterSubscribersState,
  ]);

  return cloneSubscriber(nextSubscriber);
}

export async function getNewsletterSubscribers() {
  if (shouldUseMockData()) {
    return getDemoNewsletterSubscribers();
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });

  return subscribers as NewsletterSubscriber[];
}

export async function subscribeToNewsletter(email: string) {
  const normalizedEmail = normalizeNewsletterEmail(email);

  if (shouldUseMockData()) {
    return subscribeDemoNewsletter(normalizedEmail);
  }

  const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingSubscriber) {
    return existingSubscriber as NewsletterSubscriber;
  }

  const subscriber = await prisma.newsletterSubscriber.create({
    data: { email: normalizedEmail },
  });

  return subscriber as NewsletterSubscriber;
}

export async function sendNewsletter(subject: string, content: string) {
  console.log("[Newsletter] Starting newsletter send...");

  // 1. Validate API key
  const resend = getResendClient();
  if (!resend) {
    console.error("[Newsletter] RESEND_API_KEY is not set or empty.");
    return {
      success: false,
      error: "Resend API key is missing. Add RESEND_API_KEY in your Vercel Environment Variables.",
      count: 0,
    };
  }
  console.log("[Newsletter] Resend API key found ✓");

  // 2. Get subscribers
  const subscribers = await getNewsletterSubscribers();
  const emails = subscribers.map((s) => s.email);

  if (emails.length === 0) {
    console.log("[Newsletter] No subscribers to send to.");
    return { success: true, count: 0 };
  }
  console.log(`[Newsletter] Sending to ${emails.length} subscriber(s)...`);

  // 3. Send emails with rate-limit handling (one by one with small delay)
  let sent = 0;
  const errors: string[] = [];

  for (const email of emails) {
    try {
      const result = await resend.emails.send({
        from: "Smartest Store KE <onboarding@resend.dev>",
        to: email,
        subject: subject,
        html: content,
      });

      if (result.error) {
        console.error(`[Newsletter] Failed for ${email}:`, result.error);
        errors.push(`${email}: ${result.error.message}`);
      } else {
        sent++;
        console.log(`[Newsletter] ✓ Sent to ${email}`);
      }
    } catch (err: any) {
      console.error(`[Newsletter] Error sending to ${email}:`, err?.message || err);
      errors.push(`${email}: ${err?.message || "Unknown error"}`);
    }

    // Small delay to respect rate limits (Resend free tier: 2 emails/sec)
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`[Newsletter] Done. Sent: ${sent}/${emails.length}. Errors: ${errors.length}`);

  return {
    success: errors.length === 0,
    count: sent,
    totalSubscribers: emails.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}
