"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Mail,
    Calendar,
    Shield,
    Trash2,
    ShoppingBag,
    ExternalLink,
    ChevronRight,
    User,
    MoreVertical,
    AlertCircle,
    Loader2
} from "lucide-react";
import { formatKES } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/use-toast";
import { motion } from "framer-motion";

type UserDetailViewProps = {
    user: {
        id: string;
        email: string | null;
        fullName: string | null;
        role: string;
        createdAt: string | Date;
        orders: any[];
    };
};

export function UserDetailView({ user }: UserDetailViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Delete failed");

            toast({ title: "User deleted", description: "The user has been successfully removed." });
            router.push("/admin/users");
            router.refresh();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleRole = async () => {
        const newRole = user.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
        setIsUpdatingRole(true);
        try {
            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (!response.ok) throw new Error("Update failed");

            toast({ title: "Role updated", description: `User is now a ${newRole}.` });
            router.refresh();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update user role.", variant: "destructive" });
        } finally {
            setIsUpdatingRole(false);
        }
    };

    const totalSpent = user.orders.reduce((sum, order) => sum + order.total, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/users"
                        className="h-10 w-10 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-white">
                            {user.fullName || "Unknown User"}
                        </h1>
                        <p className="text-zinc-500 text-sm font-medium">User Profile Details</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleRole}
                        disabled={isUpdatingRole}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${user.role === "ADMIN"
                            ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                            : "bg-purple-500 text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]"
                            }`}
                    >
                        {isUpdatingRole ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.role === "ADMIN" ? (
                            <User className="h-4 w-4" />
                        ) : (
                            <Shield className="h-4 w-4" />
                        )}
                        {user.role === "ADMIN" ? "Revoke Admin" : "Make Admin"}
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                    >
                        {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl shadow-black/20">
                        <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-900">
                            <div className="h-24 w-24 rounded-[2rem] bg-brand-500 flex items-center justify-center text-white text-3xl font-black mb-4 shadow-2xl shadow-brand-500/20">
                                {user.fullName?.[0] || user.email?.[0] || "?"}
                            </div>
                            <h3 className="text-xl font-black">{user.fullName || "Unnamed"}</h3>
                            <p className="text-zinc-500 text-sm">{user.email}</p>

                            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                {user.role}
                            </div>
                        </div>

                        <div className="py-6 space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-zinc-500" />
                                <span className="text-zinc-300 font-medium">{user.email || "No email"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-zinc-500" />
                                <span className="text-zinc-300 font-medium">
                                    Joined {new Date(user.createdAt).toLocaleDateString("en-KE", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric"
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-zinc-900">
                            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Orders</p>
                                <p className="text-xl font-black text-brand-400">{user.orders.length}</p>
                            </div>
                            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">Total Spent</p>
                                <p className="text-lg font-black text-emerald-400">{formatKES(totalSpent)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders History */}
                <div className="lg:col-span-2">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl shadow-black/20 font-sans">
                        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-orange-500" />
                                <h3 className="font-black text-lg">Order History</h3>
                            </div>
                            <span className="text-xs font-bold text-zinc-500">{user.orders.length} total orders</span>
                        </div>

                        <div className="divide-y divide-zinc-900">
                            {user.orders.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag className="h-8 w-8 text-zinc-700" />
                                    </div>
                                    <p className="text-zinc-500 font-medium font-display italic">No orders found for this user.</p>
                                </div>
                            ) : (
                                user.orders.map((order, index) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-6 hover:bg-zinc-900/30 transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold group-hover:border-orange-500/30 transition-all">
                                                #{order.orderNumber.slice(-4)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-brand-400 transition-colors">Order {order.orderNumber}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-zinc-500 font-medium">
                                                        {new Date(order.createdAt).toLocaleDateString("en-KE", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric"
                                                        })}
                                                    </span>
                                                    <span className="h-1 w-1 rounded-full bg-zinc-800" />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${order.status === "delivered" ? "text-emerald-400" :
                                                        order.status === "cancelled" ? "text-rose-400" : "text-amber-400"
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <p className="font-black text-zinc-200">{formatKES(order.total)}</p>
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-brand-400 hover:border-brand-400/50 transition-all shadow-sm"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
