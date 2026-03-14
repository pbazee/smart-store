import { redirect } from "next/navigation";
import { ShippingRulesView } from "@/app/admin/shipping-rules/shipping-rules-view";
import { fetchShippingRulesAction } from "@/app/admin/shipping-rules/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function ShippingRulesPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fshipping-rules");
  }

  const rules = await fetchShippingRulesAction();

  return <ShippingRulesView initialRules={rules} />;
}
