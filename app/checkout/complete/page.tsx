import { getSupportContactInfo } from "@/lib/support-contact";
import { CheckoutCompletePageClient } from "./checkout-complete-client";

export default async function CheckoutCompletePage() {
  const { supportEmail, supportPhone } = await getSupportContactInfo();

  return (
    <CheckoutCompletePageClient
      supportEmail={supportEmail}
      supportPhone={supportPhone}
    />
  );
}
