"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Search,
    ChevronRight,
    ArrowUpDown,
    UserCircle2,
    ShieldCheck,
    History,
    WalletCards
} from "lucide-react";
import type { AdminUserSummary } from "@/lib/admin-user-service";
import { formatKES } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type UsersManagerProps = {
    initialUsers: AdminUserSummary[];
};

type SortField = "createdAt" | "totalOrders" | "totalSpent" | "fullName" | "email";
type SortOrder = "asc" | "desc";

export function UsersManager({ initialUsers }: UsersManagerProps) {
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const filteredUsers = initialUsers
        .filter((user) => {
            const searchLower = search.toLowerCase();
            return (
                user.fullName?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => {
            let aVal: any = a[sortField];
            let bVal: any = b[sortField];

            if (sortField === "createdAt") {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }

            if (sortOrder === "asc") {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl shadow-black/30">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                <th
                                    className="px-6 py-4 font-bold text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors uppercase tracking-widest text-[10px]"
                                    onClick={() => toggleSort("fullName")}
                                >
                                    <div className="flex items-center gap-2">
                                        User {sortField === "fullName" && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Role</th>
                                <th
                                    className="px-6 py-4 font-bold text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors uppercase tracking-widest text-[10px]"
                                    onClick={() => toggleSort("createdAt")}
                                >
                                    <div className="flex items-center gap-2">
                                        Joined {sortField === "createdAt" && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 font-bold text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors uppercase tracking-widest text-[10px]"
                                    onClick={() => toggleSort("totalOrders")}
                                >
                                    <div className="flex items-center gap-2">
                                        Orders {sortField === "totalOrders" && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 font-bold text-zinc-400 cursor-pointer hover:text-zinc-200 transition-colors uppercase tracking-widest text-[10px]"
                                    onClick={() => toggleSort("totalSpent")}
                                >
                                    <div className="flex items-center gap-2">
                                        Total Spent {sortField === "totalSpent" && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                </th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            <AnimatePresence initial={false}>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-zinc-500 font-medium italic">
                                            No users found. Try adjustment your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user, index) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="group hover:bg-zinc-900/40 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-5">
                                                <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                        <UserCircle2 className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white group-hover:text-orange-400 transition-colors truncate max-w-[180px]">
                                                            {user.fullName || "Unnamed User"}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 truncate max-w-[180px]">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${user.role === "ADMIN"
                                                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                    }`}>
                                                    {user.role === "ADMIN" && <ShieldCheck className="h-3 w-3" />}
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-zinc-400">
                                                    <History className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-semibold">
                                                        {new Date(user.createdAt).toLocaleDateString("en-KE", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric"
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-black text-zinc-300">
                                                {user.totalOrders}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 font-black text-emerald-400">
                                                    <WalletCards className="h-3.5 w-3.5" />
                                                    {formatKES(user.totalSpent)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Link href={`/admin/users/${user.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 hover:bg-orange-500 hover:text-white transition-all">
                                                    <ChevronRight className="h-5 w-5" />
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
