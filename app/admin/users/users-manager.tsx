"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  Search,
  Shield,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import type { AdminUserSummary } from "@/lib/admin-user-service";
import { formatKES } from "@/lib/utils";

type UsersManagerProps = {
  initialUsers: AdminUserSummary[];
};

type SortField = "createdAt" | "totalOrders" | "totalSpent" | "fullName" | "email";
type SortOrder = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function SortIndicator({
  active,
  order,
}: {
  active: boolean;
  order: SortOrder;
}) {
  if (!active) {
    return <ChevronDown className="h-3 w-3 opacity-40" />;
  }

  return order === "asc" ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  );
}

export function UsersManager({ initialUsers }: UsersManagerProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deferredSearch = useDeferredValue(search);

  const filteredUsers = useMemo(() => {
    const searchLower = deferredSearch.trim().toLowerCase();

    return [...initialUsers]
      .filter((user) => {
        if (!searchLower) {
          return true;
        }

        return (
          (user.fullName || "").toLowerCase().includes(searchLower) ||
          (user.email || "").toLowerCase().includes(searchLower)
        );
      })
      .sort((left, right) => {
        let leftValue: string | number = left[sortField] as string | number;
        let rightValue: string | number = right[sortField] as string | number;

        if (sortField === "createdAt") {
          leftValue = new Date(left.createdAt).getTime();
          rightValue = new Date(right.createdAt).getTime();
        }

        if (typeof leftValue === "string") {
          leftValue = leftValue.toLowerCase();
        }

        if (typeof rightValue === "string") {
          rightValue = rightValue.toLowerCase();
        }

        if (leftValue === rightValue) {
          return 0;
        }

        const result = leftValue > rightValue ? 1 : -1;
        return sortOrder === "asc" ? result : -result;
      });
  }, [deferredSearch, initialUsers, sortField, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, pageSize, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortOrder(field === "fullName" || field === "email" ? "asc" : "desc");
  };

  const totalRevenue = filteredUsers.reduce((sum, user) => sum + user.totalSpent, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Registered users</p>
          <p className="mt-2 text-3xl font-black text-white">{initialUsers.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Visible results</p>
          <p className="mt-2 text-3xl font-black text-white">{filteredUsers.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total spent</p>
          <p className="mt-2 text-3xl font-black text-emerald-400">{formatKES(totalRevenue)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 w-full rounded-full border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-500/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Per page
          </span>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-xl shadow-black/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th
                  className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-200"
                  onClick={() => toggleSort("fullName")}
                >
                  <button type="button" className="flex items-center gap-2">
                    User
                    <SortIndicator active={sortField === "fullName"} order={sortOrder} />
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Role
                </th>
                <th
                  className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-200"
                  onClick={() => toggleSort("createdAt")}
                >
                  <button type="button" className="flex items-center gap-2">
                    Joined
                    <SortIndicator active={sortField === "createdAt"} order={sortOrder} />
                  </button>
                </th>
                <th
                  className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-200"
                  onClick={() => toggleSort("totalOrders")}
                >
                  <button type="button" className="flex items-center gap-2">
                    Orders
                    <SortIndicator active={sortField === "totalOrders"} order={sortOrder} />
                  </button>
                </th>
                <th
                  className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-200"
                  onClick={() => toggleSort("totalSpent")}
                >
                  <button type="button" className="flex items-center gap-2">
                    Total Spent
                    <SortIndicator active={sortField === "totalSpent"} order={sortOrder} />
                  </button>
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-zinc-500">
                    No users found. Try adjusting the search.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group hover:bg-zinc-900/40"
                  >
                    <td className="px-6 py-5">
                      <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-all group-hover:bg-orange-500 group-hover:text-white">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="max-w-[220px] truncate font-black text-white transition-colors group-hover:text-orange-400">
                            {user.fullName || "Unnamed User"}
                          </p>
                          <p className="max-w-[220px] truncate text-xs text-zinc-500">
                            {user.email || "No email address"}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                          user.role === "ADMIN"
                            ? "border-purple-500/20 bg-purple-500/10 text-purple-400"
                            : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {user.role === "ADMIN" ? <Shield className="h-3 w-3" /> : null}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">
                          {new Date(user.createdAt).toLocaleDateString("en-KE", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-zinc-300">{user.totalOrders}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 font-black text-emerald-400">
                        <CreditCard className="h-4 w-4" />
                        {formatKES(user.totalSpent)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 transition-all hover:bg-orange-500 hover:text-white"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400">
            Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
