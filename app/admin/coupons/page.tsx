import { redirect } from "next/navigation";
import { CouponsManager } from "@/app/admin/coupons/coupons-manager";
import { fetchAdminCoupons } from "@/app/admin/coupons/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminCouponsPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/login?redirect_url=%2Fadmin%2Fcoupons");
  }

  const coupons = await fetchAdminCoupons();

  return <CouponsManager initialCoupons={coupons} />;
}
