"use client";

import { useEffect } from "react";

/**
 * ScrollToTop — mounts invisibly and scrolls to (0,0) on every page navigation.
 * Add to any server-component page that renders at the wrong scroll position.
 */
export function ScrollToTop() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return null;
}
