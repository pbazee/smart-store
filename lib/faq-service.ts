import { shouldUseMockData } from "@/lib/live-data-mode";
import { prisma } from "@/lib/prisma";
import type { FAQ } from "@/types";

let demoFAQs: FAQ[] = [
  {
    id: "1",
    question: "How long does delivery take?",
    answer: "We offer same-day delivery within Nairobi and 1-3 business days for other regions in Kenya.",
    order: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    question: "What payment methods do you accept?",
    answer: "We accept M-Pesa, credit/debit cards, and cash on delivery for select locations.",
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function getFAQs(options: { onlyActive?: boolean } = {}) {
  if (shouldUseMockData()) {
    return options.onlyActive
      ? demoFAQs.filter((f) => f.isActive).sort((a, b) => a.order - b.order)
      : [...demoFAQs].sort((a, b) => a.order - b.order);
  }

  try {
    const faqs = await prisma.fAQ.findMany({
      where: options.onlyActive ? { isActive: true } : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return faqs as FAQ[];
  } catch (error) {
    console.error("Failed to fetch FAQs, falling back to demo settings:", error);
    return options.onlyActive
      ? demoFAQs.filter((f) => f.isActive).sort((a, b) => a.order - b.order)
      : [...demoFAQs].sort((a, b) => a.order - b.order);
  }
}

export async function createFAQ(data: { question: string; answer: string; order?: number }) {
  if (shouldUseMockData()) {
    const newFAQ: FAQ = {
      id: crypto.randomUUID(),
      question: data.question,
      answer: data.answer,
      order: data.order ?? demoFAQs.length,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    demoFAQs.push(newFAQ);
    return newFAQ;
  }

  const maxOrder = await prisma.fAQ.aggregate({
    _max: { order: true },
  });

  const faq = await prisma.fAQ.create({
    data: {
      question: data.question,
      answer: data.answer,
      order: data.order ?? (maxOrder._max.order ?? -1) + 1,
    },
  });

  return faq as FAQ;
}

export async function updateFAQ(
  id: string,
  data: { question?: string; answer?: string; order?: number; isActive?: boolean }
) {
  if (shouldUseMockData()) {
    const index = demoFAQs.findIndex((f) => f.id === id);
    if (index === -1) throw new Error("FAQ not found");
    demoFAQs[index] = {
      ...demoFAQs[index],
      ...data,
      updatedAt: new Date(),
    };
    return demoFAQs[index];
  }

  const faq = await prisma.fAQ.update({
    where: { id },
    data,
  });

  return faq as FAQ;
}

export async function deleteFAQ(id: string) {
  if (shouldUseMockData()) {
    demoFAQs = demoFAQs.filter((f) => f.id !== id);
    return true;
  }

  await prisma.fAQ.delete({ where: { id } });
  return true;
}
