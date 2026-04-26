import { redirect } from "next/navigation";
import { getCachedAdminUser } from "@/lib/auth-cache";
import { getAllReviewsAdmin } from "@/lib/reviews-service";
import { ReviewsManager } from "./reviews-manager";
import { MessageCircle } from "lucide-react";

export default async function AdminReviewsPage() {
    const adminUser = await getCachedAdminUser();
    if (!adminUser) {
        redirect("/");
    }


    const reviews = await getAllReviewsAdmin();

    return (
        <div className="p-6 md:p-10">
            <div className="mb-10">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                        <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="font-display text-3xl font-black">Reviews Management</h1>
                        <p className="mt-1 text-muted-foreground">
                            Approve, moderate, or remove customer feedback to keep the site premium.
                        </p>
                    </div>
                </div>
            </div>

            <ReviewsManager initialReviews={reviews} />
        </div>
    );
}
