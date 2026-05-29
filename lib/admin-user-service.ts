import { prisma } from "@/lib/prisma";
import { shouldUseMockData } from "@/lib/live-data-mode";
import { isProtectedAdminEmail } from "@/lib/admin-identity";
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

export const PROTECTED_ADMIN_USER_ERROR = "The protected admin account cannot be demoted or deleted.";

export async function getAllUsersAdmin(): Promise<AdminUserSummary[]> {
    if (shouldUseMockData()) {
        return []; // For now, could add mock users
    }

    const [users, orderTotals] = await Promise.all([
        prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                fullName: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
        prisma.order.groupBy({
            by: ["userId"],
            where: { userId: { not: null } },
            _count: { _all: true },
            _sum: { total: true },
        }),
    ]);
    const totalsByUserId = new Map(
        orderTotals
            .filter((entry) => entry.userId)
            .map((entry) => [
                entry.userId as string,
                {
                    totalOrders: entry._count._all,
                    totalSpent: entry._sum.total ?? 0,
                },
            ])
    );

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
        totalOrders: totalsByUserId.get(user.id)?.totalOrders ?? 0,
        totalSpent: totalsByUserId.get(user.id)?.totalSpent ?? 0,
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

    const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
    });

    if (!existingUser) {
        return null;
    }

    if (isProtectedAdminEmail(existingUser.email) && role !== UserRole.ADMIN) {
        throw new Error(PROTECTED_ADMIN_USER_ERROR);
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

    const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
    });

    if (!existingUser) {
        return null;
    }

    if (isProtectedAdminEmail(existingUser.email)) {
        throw new Error(PROTECTED_ADMIN_USER_ERROR);
    }

    // Handle cascading or related records if necessary, but Prisma schema might have onDelete: Cascade
    return prisma.user.delete({
        where: { id: userId },
    });
}
