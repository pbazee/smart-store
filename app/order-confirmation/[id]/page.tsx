"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatKES } from "@/lib/utils";
import { CheckCircle, Package, Truck, MapPin, Calendar, ArrowRight } from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  productId: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  items: OrderItem[];
  address: string;
  city: string;
  createdAt: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data.data);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse">
          <div className="h-12 bg-muted rounded-lg mb-4"></div>
          <div className="h-6 bg-muted rounded-lg mb-2"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-lg font-bold mb-4">Order not found</p>
        <Link href="/orders" className="text-brand-500 hover:underline">
          View all orders
        </Link>
      </div>
    );
  }

  const statusSteps = [
    { label: "Order Placed", status: "pending", icon: Package },
    { label: "Processing", status: "processing", icon: Package },
    { label: "Shipped", status: "shipped", icon: Truck },
    { label: "Delivered", status: "delivered", icon: CheckCircle },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.status === order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-black mb-2">Order Confirmed! 🎉</h1>
        <p className="text-muted-foreground">
          Order number <span className="font-bold text-foreground">{order.orderNumber}</span>
        </p>
      </div>

      {/* Order Status Timeline */}
      <div className="border border-border rounded-2xl p-6 mb-8">
        <h2 className="font-bold mb-6">Order Status</h2>
        <div className="flex items-center gap-2 justify-between">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= currentStepIndex;
            return (
              <div key={step.status} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    isActive
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className={`text-xs text-center font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mt-2 mb-12 transition-all ${
                      index < currentStepIndex ? "bg-green-500" : "bg-muted"
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details */}
      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        {/* Shipping Info */}
        <div className="border border-border rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" />
            Shipping Address
          </h3>
          <p className="text-sm text-muted-foreground mb-2">{order.address}</p>
          <p className="text-sm text-muted-foreground">{order.city}, Kenya</p>
        </div>

        {/* Order Date */}
        <div className="border border-border rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            Order Date
          </h3>
          <p className="text-sm">
            {new Date(order.createdAt).toLocaleDateString("en-KE", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="border border-border rounded-2xl p-6 mb-6">
        <h3 className="font-bold mb-4">Order Items</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between pb-4 border-b border-border last:border-b-0">
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
              </div>
              <p className="font-bold text-brand-600">{formatKES(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-border pt-4 mt-4 flex justify-between items-center">
          <span className="font-bold text-lg">Total</span>
          <span className="font-black text-2xl text-brand-600">{formatKES(order.total)}</span>
        </div>
      </div>

      {/* Payment Status */}
      {order.paymentStatus === "paid" && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            ✓ Payment successful
          </p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
            Your payment has been verified and your order is being processed.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link
          href="/orders"
          className="w-full px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          View All Orders <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/shop"
          className="w-full px-6 py-3 border border-border hover:bg-muted text-foreground font-semibold rounded-lg transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
