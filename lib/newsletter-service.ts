import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { NewsletterSubscriber } from "@/types";

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
