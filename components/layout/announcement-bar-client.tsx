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
      <span className="text-sm flex-shrink-0 sm:text-base md:text-lg">{announcement.icon}</span>
      <span className="block min-w-0 flex-1 truncate font-normal">{announcement.text}</span>
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
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const hasMultipleAnnouncements = announcements.length > 1;
  const activeAnnouncement = announcements[activeIndex] ?? announcements[0];

  useEffect(() => {
    const syncVisibility = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (!isVisible || isPaused || !hasMultipleAnnouncements || !isDocumentVisible) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % announcements.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [announcements.length, hasMultipleAnnouncements, isDocumentVisible, isPaused, isVisible]);

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
      className="overlay-readable-surface relative w-full max-w-full overflow-hidden border-b border-white/25 bg-gradient-to-r from-[#ff6b00] via-[#ff7a00] to-[#ff3d2e] text-white shadow-[0_10px_32px_rgba(255,107,0,0.28)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-0.5 px-2 py-1 sm:px-4 sm:py-1.5">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={!hasMultipleAnnouncements}
          className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/20 disabled:cursor-default disabled:opacity-35"
          aria-label="Show previous announcement"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="relative flex-1 overflow-hidden" aria-live="polite">
          {hasMultipleAnnouncements ? (
            <AnimatePresence
              mode="wait"
              initial={false}
              key={`announcement-presence-${announcements.length}`}
            >
              <motion.div
                key={
                  activeAnnouncement.id ||
                  `${activeAnnouncement.text}-${activeAnnouncement.link ?? "no-link"}-${activeIndex}`
                }
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex min-h-7 items-center justify-center px-2 text-center text-[12px] font-normal leading-tight sm:text-[13px] md:text-sm"
              >
                <AnnouncementCopy announcement={activeAnnouncement} />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex min-h-7 items-center justify-center px-2 text-center text-[12px] font-normal leading-tight sm:text-[13px] md:text-sm">
              <AnnouncementCopy announcement={activeAnnouncement} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={goToNext}
          disabled={!hasMultipleAnnouncements}
          className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/20 disabled:cursor-default disabled:opacity-35"
          aria-label="Show next announcement"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/20"
          aria-label="Close announcement bar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
