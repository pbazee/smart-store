import { prisma } from "@/lib/prisma";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { UserRole } from "@prisma/client";

export type AdminUserSummary = {
    id: string;
    email: string | null;
    fullName: string | null;
    role: UserRole;
    createdAt: Date;
    totalOrders: number;
    totalSpent: number;
};

export async function getAllUsersAdmin(): Promise<AdminUserSummary[]> {
    if (shouldUseMockData()) {
        return []; // For now, could add mock users
    }

    const users = await prisma.user.findMany({
        include: {
            orders: {
                select: {
                    total: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return users.map((user) => ({
        id: user.id,
        email: user.email,
        fullName:
            user.fullName ||
            [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
            user.email ||
            null,
        role: user.role,
        createdAt: user.createdAt,
        totalOrders: user.orders.length,
        totalSpent: user.orders.reduce((sum, order) => sum + order.total, 0),
    }));
}

export async function getUserDetailAdmin(userId: string) {
    if (shouldUseMockData()) {
        return null;
    }

    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            orders: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });
}

export async function updateUserRoleAdmin(userId: string, role: UserRole) {
    if (shouldUseMockData()) {
        return null;
    }

    return prisma.user.update({
        where: { id: userId },
        data: { role },
    });
}

export async function deleteUserAdmin(userId: string) {
    if (shouldUseMockData()) {
        return null;
    }

    // Handle cascading or related records if necessary, but Prisma schema might have onDelete: Cascade
    return prisma.user.delete({
        where: { id: userId },
    });
}
