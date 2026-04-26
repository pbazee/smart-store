import { prisma } from "@/lib/prisma";
import { ensureFAQStorage } from "@/lib/runtime-schema-repair";
import { shouldSkipLiveDataDuringBuild } from "@/lib/live-data-mode";
import type { FAQ } from "@/types";

export async function getFAQs(options: { onlyActive?: boolean } = {}) {
  if (shouldSkipLiveDataDuringBuild()) {
    return [];
  }

  await ensureFAQStorage();

  const faqs = await prisma.fAQ.findMany({
    where: options.onlyActive ? { isActive: true } : undefined,
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return faqs as FAQ[];
}

export async function createFAQ(data: { question: string; answer: string; order?: number }) {
  await ensureFAQStorage();

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
  await ensureFAQStorage();

  const faq = await prisma.fAQ.update({
    where: { id },
    data,
  });

  return faq as FAQ;
}

export async function deleteFAQ(id: string) {
  await ensureFAQStorage();

  await prisma.fAQ.delete({ where: { id } });
  return true;
}
