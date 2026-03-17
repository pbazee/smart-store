"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { AnnouncementMessage } from "@/types";

function isExternalLink(link: string) {
  return /^https?:\/\//i.test(link);
}

function AnnouncementCopy({ announcement }: { announcement: AnnouncementMessage }) {
  const content = (
    <>
      <span className="text-lg sm:text-xl md:text-2xl flex-shrink-0">{announcement.icon}</span>
      <span className="block min-w-0 flex-1 truncate font-bold">{announcement.text}</span>
    </>
  );

  if (!announcement.link) {
    return <div className="flex min-w-0 flex-1 items-center justify-center gap-2">{content}</div>;
  }

  if (isExternalLink(announcement.link)) {
    return (
      <a
        href={announcement.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center justify-center gap-2 hover:underline"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={announcement.link}
      className="flex min-w-0 flex-1 items-center justify-center gap-2 hover:underline"
    >
      {content}
    </Link>
  );
}

export function AnnouncementBarClient({
  announcements,
}: {
  announcements: AnnouncementMessage[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const hasMultipleAnnouncements = announcements.length > 1;
  const activeAnnouncement = announcements[activeIndex] ?? announcements[0];

  useEffect(() => {
    if (!isVisible || isPaused || !hasMultipleAnnouncements) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % announcements.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [announcements.length, hasMultipleAnnouncements, isPaused, isVisible]);

  useEffect(() => {
    if (activeIndex >= announcements.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, announcements.length]);

  if (!isVisible || !activeAnnouncement) {
    return null;
  }

  const goToPrevious = () => {
    if (!hasMultipleAnnouncements) {
      return;
    }

    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? announcements.length - 1 : currentIndex - 1
    );
  };

  const goToNext = () => {
    if (!hasMultipleAnnouncements) {
      return;
    }

    setActiveIndex((currentIndex) => (currentIndex + 1) % announcements.length);
  };

  return (
    <motion.div
      className="overlay-readable-surface relative z-[60] overflow-hidden border-b border-white/25 bg-gradient-to-r from-[#ff6b00] via-[#ff7a00] to-[#ff3d2e] text-white shadow-[0_10px_32px_rgba(255,107,0,0.28)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[-20%] w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]"
        animate={{ x: ["-10%", "240%"] }}
        transition={{ duration: 3.4, ease: "linear", repeat: Infinity }}
      />
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-2 py-2.5 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={!hasMultipleAnnouncements}
          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/20 disabled:cursor-default disabled:opacity-35"
          aria-label="Show previous announcement"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="relative flex-1 overflow-hidden" aria-live="polite">
          {hasMultipleAnnouncements ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeAnnouncement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex min-h-10 items-center justify-center px-2 text-center text-[13px] font-black sm:text-base md:text-lg"
              >
                <AnnouncementCopy announcement={activeAnnouncement} />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex min-h-10 items-center justify-center px-2 text-center text-[13px] font-black sm:text-base md:text-lg">
              <AnnouncementCopy announcement={activeAnnouncement} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={goToNext}
          disabled={!hasMultipleAnnouncements}
          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/20 disabled:cursor-default disabled:opacity-35"
          aria-label="Show next announcement"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/20"
          aria-label="Close announcement bar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}
