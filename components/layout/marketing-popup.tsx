import { unstable_noStore as noStore } from "next/cache";
import { MarketingPopupClient } from "@/components/layout/marketing-popup-client";
import { getActivePopups } from "@/lib/popup-service";
import type { Popup } from "@/types";

export async function MarketingPopup({
  popups: providedPopups,
}: {
  popups?: Popup[];
}) {
  let popups = providedPopups;

  if (!popups) {
    noStore();
    popups = await getActivePopups();
  }

  if (popups.length === 0) {
    return null;
  }

  return <MarketingPopupClient popups={popups} />;
}
