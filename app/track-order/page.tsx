import { getSupportContactInfo } from "@/lib/support-contact";
import { TrackOrderClient } from "./track-order-client";

export default async function TrackOrderPage() {
  const { supportPhone, supportTel } = await getSupportContactInfo();

  return <TrackOrderClient supportPhone={supportPhone} supportTel={supportTel} />;
}
