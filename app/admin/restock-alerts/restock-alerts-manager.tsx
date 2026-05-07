"use client";

import { useState } from "react";

type RestockAlertRow = {
  id: string;
  email: string;
  phone?: string | null;
  productId: string;
  variantId?: string | null;
  sizeName?: string | null;
  notified: boolean;
  createdAt: string | Date;
  product: {
    id: string;
    name: string;
  };
  variant?: {
    id: string;
    color: string;
    size: string;
  } | null;
};

export function RestockAlertsManager({
  initialNotifications,
}: {
  initialNotifications: RestockAlertRow[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const updateStatus = async (id: string, notified: boolean) => {
    const response = await fetch(`/api/admin/restock-notifications/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notified }),
    });

    if (!response.ok) {
      return;
    }

    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, notified } : item))
    );
  };

  const deleteAlert = async (id: string) => {
    const response = await fetch(`/api/admin/restock-notifications/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return;
    }

    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Restock Alerts</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Customers waiting to hear when products come back in stock.
        </p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-900/40">
        <table className="w-full text-left">
          <thead className="border-b border-zinc-800">
            <tr className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Phone</th>
              <th className="px-4 py-4">Product</th>
              <th className="px-4 py-4">Variant/Size</th>
              <th className="px-4 py-4">Date requested</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-200">
            {notifications.map((notification) => (
              <tr key={notification.id}>
                <td className="px-4 py-4">{notification.email}</td>
                <td className="px-4 py-4">{notification.phone || "—"}</td>
                <td className="px-4 py-4">{notification.product.name}</td>
                <td className="px-4 py-4">
                  {notification.variant
                    ? `${notification.variant.color}${notification.variant.size ? ` / ${notification.variant.size}` : ""}`
                    : notification.sizeName || "Single item"}
                </td>
                <td className="px-4 py-4">
                  {new Date(notification.createdAt).toLocaleString("en-KE")}
                </td>
                <td className="px-4 py-4">
                  {notification.notified ? "Notified" : "Pending"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void updateStatus(notification.id, !notification.notified)}
                      className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-100"
                    >
                      {notification.notified ? "Mark pending" : "Mark notified"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteAlert(notification.id)}
                      className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {notifications.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  No restock alerts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
