"use client";

import confetti from "canvas-confetti";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, Receipt, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";
import { formatKES } from "@/lib/utils";

type PendingCheckout = {
  orderId?: string;
  orderNumber?: string;
  reference?: string;
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
};

const CONFIRM_RETRY_DELAY_MS = 1500;
const CONFIRM_RETRY_COUNT = 6;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function CheckoutCompleteContent() {
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
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-8 sm:p-10 shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">Payment confirmed</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Order created successfully</h1>
            <p className="mt-3 text-muted-foreground">
              Your Paystack payment went through and the order is now processing.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Order number</p>
              <p className="mt-2 text-lg font-bold">{result.orderNumber}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Payment</p>
              <p className="mt-2 text-lg font-bold">
                {result.paymentMethod === "mpesa" ? "M-Pesa via Paystack" : "Card via Paystack"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
              <p className="mt-2 text-lg font-bold">{typeof result.total === "number" ? formatKES(result.total) : "Confirmed"}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Payment successful - Order created
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="flex-1 rounded-xl bg-brand-500 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-600">
              Continue Shopping
            </Link>
            {result.userId ? (
              <Link href="/orders" className="flex-1 rounded-xl border border-border px-6 py-3 text-center font-semibold transition-colors hover:bg-muted">
                View Orders
              </Link>
            ) : (
              <Link href="/checkout" className="flex-1 rounded-xl border border-border px-6 py-3 text-center font-semibold transition-colors hover:bg-muted">
                Start New Checkout
              </Link>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white/75 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Receipt className="h-4 w-4 text-brand-500" />
                Saved to your order record
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep order number <span className="font-semibold text-foreground">{result.orderNumber}</span> for support and delivery updates.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white/75 p-4">
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
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black mb-3">Payment confirmation failed</h1>
        <p className="text-muted-foreground mb-3">{error}</p>
        {pendingCheckout?.orderNumber && (
          <p className="text-sm text-muted-foreground mb-8">
            Pending order: <span className="font-semibold text-foreground">{pendingCheckout.orderNumber}</span>
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Link href="/checkout" className="w-full px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors">
            Return to checkout
          </Link>
          <Link href="/shop" className="w-full px-6 py-3 border border-border hover:bg-muted rounded-lg transition-colors">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto mb-6">
        <LoaderCircle className="w-8 h-8 animate-spin" />
      </div>
      <h1 className="text-2xl font-black mb-3">Confirming payment</h1>
      <p className="text-muted-foreground">
        Please wait while we verify your Paystack payment and finalize the order.
      </p>
      {pendingCheckout?.orderNumber && (
        <p className="mt-4 text-sm text-muted-foreground">
          Preparing order <span className="font-semibold text-foreground">{pendingCheckout.orderNumber}</span>
        </p>
      )}
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto mb-6">
            <LoaderCircle className="w-8 h-8 animate-spin" />
          </div>
          <h1 className="text-2xl font-black mb-3">Confirming payment</h1>
          <p className="text-muted-foreground">
            Please wait while we verify your Paystack payment and finalize the order.
          </p>
        </div>
      }
    >
      <CheckoutCompleteContent />
    </Suspense>
  );
}
