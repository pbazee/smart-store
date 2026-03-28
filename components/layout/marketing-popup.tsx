import { MarketingPopupClient } from "@/components/layout/marketing-popup-client";
import { getHomepageShellData } from "@/lib/homepage-data";
import type { Popup } from "@/types";

export async function MarketingPopup({
  popups: providedPopups,
}: {
  popups?: Popup[];
}) {
  let popups = providedPopups;

  if (!popups) {
    try {
      popups = (await getHomepageShellData()).popups;
    } catch (error) {
      console.error("[MarketingPopup] Failed to load popups:", error);
      popups = [];
    }
  }

  if (popups.length === 0) {
    return null;
  }

  return <MarketingPopupClient popups={popups} />;
}
