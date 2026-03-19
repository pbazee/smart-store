import { getUserDetailAdmin } from "@/lib/admin-user-service";
import { notFound } from "next/navigation";
import { UserDetailView } from "./user-detail-view";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getUserDetailAdmin(id);

    if (!user) {
        notFound();
    }

    return <UserDetailView user={user as any} />;
}
