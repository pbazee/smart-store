"use client";

import confetti from "canvas-confetti";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2, Receipt, ShoppingBag } from "lucide-react";
import { jsPDF } from "jspdf";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";
import { formatKES } from "@/lib/utils";

type PendingCheckout = {
  orderId?: string;
  orderNumber?: string;
  reference?: string;
};

type CheckoutItem = {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  variantLabel?: string | null;
};

type CheckoutConfirmation = {
  orderId: string;
  orderNumber: string;
  state: string;
  userId?: string | null;
  total?: number;
  customerEmail?: string;
  customerName?: string;
  paymentMethod?: string;
  shippingAmount?: number;
  shippingRuleName?: string | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  createdAt?: string | Date;
  items?: CheckoutItem[];
};

const CONFIRM_RETRY_DELAY_MS = 1500;
const CONFIRM_RETRY_COUNT = 6;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function CheckoutCompleteContent({
  supportEmail,
  supportPhone,
}: {
  supportEmail: string;
  supportPhone: string;
}) {
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutConfirmation | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const confirmPayment = async () => {
      let storedPendingCheckout: PendingCheckout | null = null;

      const rawPendingCheckout = localStorage.getItem("pending-checkout");
      if (rawPendingCheckout) {
        try {
          storedPendingCheckout = JSON.parse(rawPendingCheckout) as PendingCheckout;
          setPendingCheckout(storedPendingCheckout);
        } catch {
          localStorage.removeItem("pending-checkout");
        }
      }

      const reference = searchParams.get("reference") ?? storedPendingCheckout?.reference;
      if (!reference) {
        setError("Missing payment reference. Please place the order again.");
        return;
      }

      for (let attempt = 0; attempt < CONFIRM_RETRY_COUNT; attempt += 1) {
        try {
          const response = await fetch("/api/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
          });

          const data = await response.json().catch(() => null);
          if (response.ok && data?.data) {
            if (isCancelled) {
              return;
            }

            const confirmation = data.data as CheckoutConfirmation;
            clearCart();
            localStorage.removeItem("checkout-data");
            localStorage.removeItem("pending-checkout");
            console.log("Payment successful - Order created", confirmation);
            toast({
              title: "Payment successful",
              description: `Order ${confirmation.orderNumber} is now confirmed.`,
            });
            void confetti({
              particleCount: 140,
              spread: 80,
              origin: { y: 0.6 },
            });
            setResult(confirmation);
            return;
          }

          const message = data?.error || "Failed to confirm payment";
          if (response.status === 409 && attempt < CONFIRM_RETRY_COUNT - 1) {
            await wait(CONFIRM_RETRY_DELAY_MS);
            continue;
          }

          throw new Error(message);
        } catch (confirmationError) {
          if (isCancelled) {
            return;
          }

          const message =
            confirmationError instanceof Error
              ? confirmationError.message
              : "Failed to confirm payment";
          setError(message);
          return;
        }
      }
    };

    void confirmPayment();

    return () => {
      isCancelled = true;
    };
  }, [clearCart, searchParams, toast]);

  if (result) {
    const createdAt = result.createdAt ? new Date(result.createdAt) : new Date();
    const items = result.items ?? [];

    const handleDownloadPdf = () => {
      const doc = new jsPDF();
      let y = 18;

      doc.setFontSize(16);
      doc.text("Smartest Store KE", 14, y);
      doc.setFontSize(11);
      doc.text(`Order: ${result.orderNumber}`, 14, (y += 8));
      doc.text(`Date: ${createdAt.toLocaleString("en-KE")}`, 14, (y += 6));
      doc.text(
        `Total: ${typeof result.total === "number" ? formatKES(result.total) : "Confirmed"}`,
        14,
        (y += 6)
      );
      doc.text(
        `Payment: ${result.paymentMethod === "mpesa" ? "M-Pesa" : "Card via Paystack"}`,
        14,
        (y += 6)
      );
      doc.text(
        `Shipping: ${
          result.shippingAmount === 0
            ? "Free"
            : typeof result.shippingAmount === "number"
              ? formatKES(result.shippingAmount)
              : "N/A"
        }${result.shippingRuleName ? ` | ${result.shippingRuleName}` : ""}`,
        14,
        (y += 6)
      );
      doc.text(
        `Ship to: ${[result.address, result.city, result.county].filter(Boolean).join(", ")}`,
        14,
        (y += 6)
      );

      y += 10;
      doc.setFontSize(12);
      doc.text("Items", 14, y);
      doc.setFontSize(11);
      y += 6;
      items.forEach((item) => {
        doc.text(item.productName, 14, y);
        doc.text(
          `${item.variantLabel ? `${item.variantLabel} | ` : ""}Qty ${item.quantity}`,
          14,
          (y += 5)
        );
        doc.text(formatKES(item.price * item.quantity), 170, y, { align: "right" });
        y += 8;
      });

      y += 6;
      doc.text("Thank you for shopping with us!", 14, y);
      doc.text(`Support: ${supportEmail} | ${supportPhone}`, 14, (y += 6));

      doc.save(`Order-${result.orderNumber || result.orderId}.pdf`);
    };

    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-8 shadow-sm dark:border-emerald-500/40 dark:from-emerald-950 dark:via-zinc-950 dark:to-zinc-900 sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <CheckCircle className="h-10 w-10" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Payment confirmed
            </p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Order created successfully</h1>
            <p className="mt-3 text-muted-foreground">
              Your Paystack payment went through and the order is now processing.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-foreground dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-400">
                Order number
              </p>
              <p className="mt-2 text-lg font-bold">{result.orderNumber}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-foreground dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-400">
                Payment
              </p>
              <p className="mt-2 text-lg font-bold">
                {result.paymentMethod === "mpesa" ? "M-Pesa via Paystack" : "Card via Paystack"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-foreground dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-400">
                Total
              </p>
              <p className="mt-2 text-lg font-bold">
                {typeof result.total === "number" ? formatKES(result.total) : "Confirmed"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200">
            Payment successful - Order created
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              onClick={handleDownloadPdf}
              className="flex-1 rounded-xl bg-orange-500 px-6 py-3 text-center font-semibold text-white shadow-[0_14px_30px_rgba(249,115,22,0.28)] transition-colors hover:bg-orange-600"
            >
              Download Receipt (PDF)
            </button>
            <Link
              href="/shop"
              className="flex-1 rounded-xl bg-brand-500 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Continue Shopping
            </Link>
            {result.userId ? (
              <Link
                href="/orders"
                className="flex-1 rounded-xl border border-border px-6 py-3 text-center font-semibold transition-colors hover:bg-muted dark:text-white"
              >
                View Orders
              </Link>
            ) : (
              <Link
                href="/checkout"
                className="flex-1 rounded-xl border border-border px-6 py-3 text-center font-semibold transition-colors hover:bg-muted dark:text-white"
              >
                Start New Checkout
              </Link>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white/75 p-4 dark:bg-zinc-900/80">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Receipt className="h-4 w-4 text-brand-500" />
                Saved to your order record
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep order number{" "}
                <span className="font-semibold text-foreground">{result.orderNumber}</span> for
                support and delivery updates.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/75 p-4 dark:bg-zinc-900/80">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShoppingBag className="h-4 w-4 text-brand-500" />
                Cart cleared
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Your reserved stock has been finalized and your cart is ready for the next order.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="mb-3 text-2xl font-black">Payment confirmation failed</h1>
        <p className="mb-3 text-muted-foreground">{error}</p>
        {pendingCheckout?.orderNumber && (
          <p className="mb-8 text-sm text-muted-foreground">
            Pending order:{" "}
            <span className="font-semibold text-foreground">{pendingCheckout.orderNumber}</span>
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Link
            href="/checkout"
            className="w-full rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Return to checkout
          </Link>
          <Link
            href="/shop"
            className="w-full rounded-lg border border-border px-6 py-3 transition-colors hover:bg-muted"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      <h1 className="mb-3 text-2xl font-black">Confirming payment</h1>
      <p className="text-muted-foreground">
        Please wait while we verify your Paystack payment and finalize the order.
      </p>
      {pendingCheckout?.orderNumber && (
        <p className="mt-4 text-sm text-muted-foreground">
          Preparing order{" "}
          <span className="font-semibold text-foreground">{pendingCheckout.orderNumber}</span>
        </p>
      )}
    </div>
  );
}

export function CheckoutCompletePageClient({
  supportEmail,
  supportPhone,
}: {
  supportEmail: string;
  supportPhone: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h1 className="mb-3 text-2xl font-black">Confirming payment</h1>
          <p className="text-muted-foreground">
            Please wait while we verify your Paystack payment and finalize the order.
          </p>
        </div>
      }
    >
      <CheckoutCompleteContent supportEmail={supportEmail} supportPhone={supportPhone} />
    </Suspense>
  );
}
