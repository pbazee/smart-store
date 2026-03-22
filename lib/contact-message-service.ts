import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import { ensureContactMessageStorage } from "@/lib/runtime-schema-repair";
import {
  sendContactMessageNotification,
  sendContactReply,
} from "@/lib/email/contact-messages";
import type { ContactMessage } from "@/types";

export type ContactMessageInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactReplyInput = {
  id: string;
  replyMessage: string;
};

let demoContactMessages: ContactMessage[] = [];

function normalizeText(value: string) {
  return value.trim();
}

export async function createContactMessage(
  input: ContactMessageInput
): Promise<ContactMessage> {
  const data = {
    name: normalizeText(input.name),
    email: normalizeText(input.email).toLowerCase(),
    subject: normalizeText(input.subject),
    message: normalizeText(input.message),
  };

  if (shouldUseMockData()) {
    const message: ContactMessage = {
      id: `contact_${Date.now()}`,
      ...data,
      status: "unread",
      createdAt: new Date(),
      repliedAt: null,
    };

    demoContactMessages = [message, ...demoContactMessages];
    return message;
  }

  await ensureContactMessageStorage();

  const message = (await prisma.contactMessage.create({
    data,
  })) as ContactMessage;

  try {
    await sendContactMessageNotification(message);
  } catch (error) {
    console.error("Failed to send contact notification email:", error);
  }

  return message;
}

export async function getAdminContactMessages(): Promise<ContactMessage[]> {
  if (shouldUseMockData()) {
    return [...demoContactMessages].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }

  await ensureContactMessageStorage();

  return (await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  })) as ContactMessage[];
}

export async function replyToContactMessage(
  input: ContactReplyInput
): Promise<ContactMessage> {
  const replyMessage = normalizeText(input.replyMessage);
  if (!replyMessage) {
    throw new Error("Reply message is required.");
  }

  if (shouldUseMockData()) {
    const existing = demoContactMessages.find((message) => message.id === input.id);
    if (!existing) {
      throw new Error("Message not found.");
    }

    const updated: ContactMessage = {
      ...existing,
      status: "replied",
      repliedAt: new Date(),
    };

    demoContactMessages = demoContactMessages.map((message) =>
      message.id === input.id ? updated : message
    );

    return updated;
  }

  await ensureContactMessageStorage();

  const message = await prisma.contactMessage.findUnique({
    where: { id: input.id },
  });

  if (!message) {
    throw new Error("Message not found.");
  }

  await sendContactReply(message as ContactMessage, replyMessage);

  return (await prisma.contactMessage.update({
    where: { id: input.id },
    data: {
      status: "replied",
      repliedAt: new Date(),
    },
  })) as ContactMessage;
}
