import { NextResponse } from "next/server";
import { getAllUsersAdmin } from "@/lib/admin-user-service";
import { requireAdminAuth } from "@/lib/auth-utils";

export async function GET() {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const users = await getAllUsersAdmin();
        return NextResponse.json(users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
