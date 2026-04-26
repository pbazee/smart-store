import { Users } from "lucide-react";
import { getAllUsersAdmin } from "@/lib/admin-user-service";
import { UsersManager } from "./users-manager";

// Removed force-dynamic for better navigation speed

export default async function AdminUsersPage() {
    const users = await getAllUsersAdmin();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black mb-2">Users</h1>
                    <p className="text-zinc-400 text-sm">
                        Manage your store's users, view their order history, and update roles.
                    </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                    <Users className="h-6 w-6" />
                </div>
            </div>

            <UsersManager initialUsers={users} />
        </div>
    );
}
