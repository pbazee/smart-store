import { NextResponse } from "next/server";
import {
    getUserDetailAdmin,
    updateUserRoleAdmin,
    deleteUserAdmin,
    PROTECTED_ADMIN_USER_ERROR,
} from "@/lib/admin-user-service";
import { requireAdminAuth } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const user = await getUserDetailAdmin(id);
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }
        return NextResponse.json(user);
    } catch (error) {
        console.error("Failed to fetch user details:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { role } = body;

        if (!role || !Object.values(UserRole).includes(role)) {
            return new NextResponse("Invalid role", { status: 400 });
        }

        const updatedUser = await updateUserRoleAdmin(id, role as UserRole);
        return NextResponse.json(updatedUser);
    } catch (error) {
        if (error instanceof Error && error.message === PROTECTED_ADMIN_USER_ERROR) {
            return new NextResponse(error.message, { status: 400 });
        }
        console.error("Failed to update user:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await requireAdminAuth();
    if (!isAdmin) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        await deleteUserAdmin(id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        if (error instanceof Error && error.message === PROTECTED_ADMIN_USER_ERROR) {
            return new NextResponse(error.message, { status: 400 });
        }
        console.error("Failed to delete user:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
