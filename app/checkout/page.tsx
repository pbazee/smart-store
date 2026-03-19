"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  CreditCard,
  Loader2,
  ShieldCheck,
  Smartphone,
  TicketPercent,
  X,
} from "lucide-react";
import { z } from "zod";
import { validateCouponAction } from "@/app/checkout/actions";
import {
  buildCheckoutPayload,
  getCheckoutCartValidationError,
  type CheckoutData,
  type CustomerData,
  type PaymentData,
  type ShippingData,
} from "@/lib/checkout-payload";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";
import { formatKES } from "@/lib/utils";

const customerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid Kenyan phone number required"),
  wantsNewsletter: z.boolean().default(true),
});

const shippingSchema = z.object({
  address: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  county: z.string().min(2, "County is required"),
  deliveryNotes: z.string().optional(),
});

const paymentSchema = z
  .object({
    method: z.enum(["mpesa", "card"]),
    mpesaPhone: z.string().optional(),
  })
  .superRefine((data, context) => {
    if (data.method === "mpesa" && (!data.mpesaPhone || data.mpesaPhone.trim().length < 10)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mpesaPhone"],
        message: "Valid M-Pesa phone number required",
      });
    }
  });

const steps = [
  { id: "customer", title: "Customer Info", description: "Contact details" },
  { id: "shipping", title: "Shipping", description: "Delivery address" },
  { id: "payment", title: "Payment", description: "Choose payment method" },
  { id: "review", title: "Review", description: "Confirm your order" },
] as const;

type PaystackChannel = "mobile_money" | "card";
type PaystackConfig = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  callbackUrl: string;
  channels: PaystackChannel[];
};

type InitializePaymentResponse = {
  success: boolean;
  data?: {
    orderId: string;
    orderNumber: string;
    reference: string;
    paystack: PaystackConfig;
  };
  error?: string;
};

const PAYSTACK_COMPLETE_MESSAGE = "paystack:complete";

const KENYA_COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Kiambu",
  "Machakos",
  "Kajiado",
  "Nyeri",
  "Uasin Gishu",
  "Kericho",
  "Laikipia",
  "Nandi",
  "Garissa",
  "Embu",
  "Meru",
  "Kilifi",
  "Kwale",
  "Turkana",
  "Narok",
  "Bungoma",
  "Busia",
  "Kakamega",
  "Trans Nzoia",
  "Migori",
  "Homa Bay",
  "Siaya",
  "Vihiga",
  "Baringo",
  "Elgeyo-Marakwet",
  "Kirinyaga",
  "Kitui",
  "Makueni",
  "Murang'a",
  "Nyandarua",
  "Samburu",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Wajir",
  "West Pokot",
  "Marsabit",
  "Mandera",
  "Lamu",
  "Isiolo",
  "Bomet",
  "Kericho",
  "Embu",
];

function getPaystackPopupFeatures() {
  if (typeof window === "undefined") {
    return "";
  }

  const width = 540;
  const height = 760;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));

  return `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
}

async function releasePendingCheckout(reference?: string) {
  if (!reference) {
    return;
  }

  try {
    await fetch("/api/checkout/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });
  } catch (error) {
    console.error("Failed to release checkout reservation", error);
  }
}

function getCheckoutCompleteUrl(reference: string) {
  return `/checkout/complete?reference=${encodeURIComponent(reference)}`;
}

export default function CheckoutPage() {
  const { hasHydrated, items, total } = useCartStore();
  const { toast } = useToast();
  const popupStateRef = useRef<{
    completed: boolean;
    popup: Window | null;
    closeWatcherId?: number;
    reference?: string;
  }>({
    completed: false,
    popup: null,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({});
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPaystackReady, setIsPaystackReady] = useState(false);
  const [paystackError, setPaystackError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [isCouponPending, setIsCouponPending] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingRuleName, setShippingRuleName] = useState<string | null>(null);
  const [isShippingQuoting, setIsShippingQuoting] = useState(false);

  const cartTotal = total();
  const appliedCoupon = checkoutData.coupon;
  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.discountAmount, cartTotal) : 0;
  const shippingSubtotal = Math.max(0, cartTotal - discountAmount);
  const finalTotal = cartTotal + shippingCost - discountAmount;

  const refreshShippingQuote = async (shippingData: ShippingData) => {
    setIsShippingQuoting(true);
    try {
      const response = await fetch("/api/checkout/shipping-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal: shippingSubtotal,
          county: shippingData.county,
          city: shippingData.city,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json?.data) {
        throw new Error(json?.error || "Failed to fetch shipping");
      }
      setShippingCost(json.data.cost ?? 0);
      setShippingRuleName(json.data.ruleName ?? null);
    } catch (error) {
      console.error("Shipping quote failed:", error);
      setShippingCost(0);
      setShippingRuleName(null);
      toast({
        title: "Using default shipping",
        description: "We could not fetch a quote. Shipping set to 0 for now.",
        variant: "destructive",
      });
    } finally {
      setIsShippingQuoting(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("checkout-data");
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as CheckoutData;
      setCheckoutData(parsed);
      setCouponInput(parsed.coupon?.code ?? "");
    } catch {
      console.error("Failed to parse checkout data");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("checkout-data", JSON.stringify(checkoutData));
  }, [checkoutData]);

  useEffect(() => {
    if (!checkoutData.coupon?.code || cartTotal <= 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const refreshedCoupon = await validateCouponAction({
          code: checkoutData.coupon!.code,
          subtotal: cartTotal,
        });

        if (!cancelled) {
          setCheckoutData((previous) => ({
            ...previous,
            coupon: refreshedCoupon,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setCheckoutData((previous) => ({
            ...previous,
            coupon: undefined,
          }));
          toast({
            title: "Coupon removed",
            description:
              error instanceof Error
                ? error.message
                : "The applied coupon is no longer valid for this cart.",
            variant: "destructive",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cartTotal, checkoutData.coupon?.code, toast]);

  useEffect(() => {
    if (!checkoutData.shipping) {
      return;
    }
    void refreshShippingQuote(checkoutData.shipping);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingSubtotal, checkoutData.shipping?.county, checkoutData.shipping?.city]);

  useEffect(() => {
    setIsPaystackReady(true);
    setPaystackError(null);

    const handlePaystackMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data as { type?: string; reference?: string } | null;
      if (data?.type !== PAYSTACK_COMPLETE_MESSAGE || !data.reference) {
        return;
      }

      popupStateRef.current.completed = true;
      if (popupStateRef.current.closeWatcherId) {
        window.clearInterval(popupStateRef.current.closeWatcherId);
      }

      window.location.href = getCheckoutCompleteUrl(data.reference);
    };

    window.addEventListener("message", handlePaystackMessage);

    return () => {
      if (popupStateRef.current.closeWatcherId) {
        window.clearInterval(popupStateRef.current.closeWatcherId);
      }
      window.removeEventListener("message", handlePaystackMessage);
    };
  }, []);

  const clearPopupWatcher = () => {
    if (popupStateRef.current.closeWatcherId) {
      window.clearInterval(popupStateRef.current.closeWatcherId);
      popupStateRef.current.closeWatcherId = undefined;
    }
  };

  const handleNext = (stepData?: CustomerData | ShippingData | PaymentData) => {
    if (stepData) {
      setCheckoutData((previous) => ({ ...previous, [steps[currentStep].id]: stepData }));

      // Handle newsletter subscription if on customer step
      if (currentStep === 0 && (stepData as CustomerData).wantsNewsletter) {
        const email = (stepData as CustomerData).email;
        void (async () => {
          try {
            const { subscribeNewsletterAction } = await import("@/app/admin/newsletter/actions");
            await subscribeNewsletterAction({ email });
          } catch (e) {
            console.error("Newsletter subscription failed during checkout:", e);
          }
        })();
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    void handlePlaceOrder();
  };

  const handlePaymentAbort = async (
    reference: string | undefined,
    message: string,
    variant: "default" | "destructive" = "default"
  ) => {
    await releasePendingCheckout(reference);
    clearPopupWatcher();
    localStorage.removeItem("pending-checkout");
    setIsProcessing(false);
    setCheckoutError(message);
    toast({
      title: variant === "destructive" ? "Checkout failed" : "Payment canceled",
      description: message,
      variant,
    });
  };

  const handlePlaceOrder = async () => {
    const cartValidationError = getCheckoutCartValidationError(items);
    if (cartValidationError) {
      setCheckoutError(cartValidationError);
      toast({ title: "Cart needs attention", description: cartValidationError, variant: "destructive" });
      return;
    }

    const payload = buildCheckoutPayload({ items, checkoutData, total: finalTotal });
    if (!payload) {
      const message = "Complete your customer, shipping, and payment details before placing the order.";
      setCheckoutError(message);
      toast({ title: "Checkout incomplete", description: message, variant: "destructive" });
      return;
    }

    if (!isPaystackReady) {
      const message =
        paystackError ?? "Secure Paystack checkout is still loading. Please try again in a moment.";
      setCheckoutError(message);
      toast({ title: "Paystack unavailable", description: message, variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setCheckoutError(null);

    let pendingReference: string | undefined;
    const popupWindow =
      typeof window !== "undefined"
        ? window.open("", "paystack_checkout", getPaystackPopupFeatures())
        : null;

    popupStateRef.current = {
      completed: false,
      popup: popupWindow,
    };

    try {
      const response = await fetch("/api/checkout/initialize-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as InitializePaymentResponse | null;
      if (!response.ok) {
        throw new Error(data?.error || "Failed to initialize payment");
      }

      if (!data?.success || !data.data?.paystack) {
        throw new Error("Paystack configuration was not returned");
      }

      pendingReference = data.data.reference;
      popupStateRef.current.reference = data.data.reference;
      localStorage.setItem(
        "pending-checkout",
        JSON.stringify({
          orderId: data.data.orderId,
          orderNumber: data.data.orderNumber,
          reference: data.data.reference,
        })
      );

      if (!data.data.paystack.authorizationUrl) {
        throw new Error("Paystack authorization URL was not returned");
      }

      if (!popupWindow || popupWindow.closed) {
        popupStateRef.current.completed = true;
        window.location.href = data.data.paystack.authorizationUrl;
        return;
      }

      popupWindow.location.href = data.data.paystack.authorizationUrl;
      popupStateRef.current.closeWatcherId = window.setInterval(() => {
        const activePopup = popupStateRef.current.popup;
        if (!activePopup || !activePopup.closed) {
          return;
        }

        clearPopupWatcher();
        popupStateRef.current.popup = null;

        if (!popupStateRef.current.completed) {
          void handlePaymentAbort(
            popupStateRef.current.reference,
            "Payment window was closed before completion. Your reserved stock has been released."
          );
        }
      }, 500);
    } catch (error) {
      clearPopupWatcher();
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
      await releasePendingCheckout(pendingReference);
      localStorage.removeItem("pending-checkout");

      const message = error instanceof Error ? error.message : "Failed to initialize payment.";
      console.error("Payment error:", error);
      setCheckoutError(message);
      toast({ title: "Checkout failed", description: message, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast({
        title: "Enter a coupon code",
        description: "Type a promo code before applying it.",
        variant: "destructive",
      });
      return;
    }

    setIsCouponPending(true);

    try {
      const coupon = await validateCouponAction({
        code: couponInput,
        subtotal: cartTotal,
      });

      setCheckoutData((previous) => ({
        ...previous,
        coupon,
      }));
      setCouponInput(coupon.code);
      toast({
        title: "Coupon applied",
        description: `${coupon.code} saved you ${formatKES(coupon.discountAmount)}.`,
      });
    } catch (error) {
      setCheckoutData((previous) => ({
        ...previous,
        coupon: undefined,
      }));
      toast({
        title: "Coupon invalid",
        description: error instanceof Error ? error.message : "Please try another code.",
        variant: "destructive",
      });
    } finally {
      setIsCouponPending(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCheckoutData((previous) => ({
      ...previous,
      coupon: undefined,
    }));
    setCouponInput("");
    toast({
      title: "Coupon removed",
      description: "The order total has been reset.",
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <CustomerStep data={checkoutData.customer} onNext={handleNext} />;
      case 1:
        return <ShippingStep data={checkoutData.shipping} onNext={handleNext} />;
      case 2:
        return (
          <PaymentStep
            data={checkoutData.payment}
            onNext={handleNext}
            finalTotal={finalTotal}
            isPaystackReady={isPaystackReady}
            paystackError={paystackError}
          />
        );
      case 3:
        return (
          <ReviewStep
            data={checkoutData}
            items={items}
            finalTotal={finalTotal}
            shippingCost={shippingCost}
            shippingRuleName={shippingRuleName}
            discountAmount={discountAmount}
            appliedCouponCode={appliedCoupon?.code ?? null}
            isProcessing={isProcessing}
            isShippingQuoting={isShippingQuoting}
            errorMessage={checkoutError}
            paystackReady={isPaystackReady}
            paystackError={paystackError}
            onNext={() => handleNext()}
          />
        );
      default:
        return null;
    }
  };

  if (!hasHydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-4">
          <div className="h-8 w-40 bg-muted rounded animate-pulse" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[640px] rounded-2xl bg-muted animate-pulse" />
            <div className="h-72 rounded-2xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-lg font-bold mb-4">Your cart is empty</p>
        <Link href="/shop" className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-bold">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link href="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>
        <h1 className="text-3xl font-black">Checkout</h1>
      </div>

      <div className="mb-8 rounded-3xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-white to-amber-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Paystack secure checkout</p>
              <p className="text-sm text-muted-foreground">M-Pesa is preferred and card stays available inside the same popup.</p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${isPaystackReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {isPaystackReady ? <CheckCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            {isPaystackReady ? "Paystack loaded" : "Loading Paystack"}
          </div>
        </div>
        {paystackError && (
          <p className="mt-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {paystackError}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 mb-8 overflow-x-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-4 flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${index < currentStep ? "bg-green-500 text-white" : index === currentStep ? "bg-brand-500 text-white" : "bg-muted text-muted-foreground"}`}>
              {index < currentStep ? "OK" : index + 1}
            </div>
            <div className="hidden sm:block">
              <p className={index === currentStep ? "font-semibold text-foreground" : "font-semibold text-muted-foreground"}>{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {index < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card border border-border rounded-2xl p-6">
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="lg:col-span-1">
          <div className="border border-border rounded-2xl p-5 bg-card sticky top-20">
            <h3 className="font-bold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {items.slice(0, 3).map((item) => (
                <div key={item.variant.id} className="flex gap-3">
                  <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.variant.color} | Size {item.variant.size} | Qty {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm">{formatKES(item.variant.price * item.quantity)}</p>
                </div>
              ))}
              {items.length > 3 && <p className="text-sm text-muted-foreground text-center">+{items.length - 3} more items</p>}
            </div>
            <div className="mb-4 rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2">
                <TicketPercent className="h-4 w-4 text-brand-500" />
                <p className="text-sm font-semibold">Coupon code</p>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                  placeholder="Enter coupon"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => void handleApplyCoupon()}
                  disabled={isCouponPending}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
                >
                  {isCouponPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </button>
              </div>
              {appliedCoupon && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <div>
                    <p className="font-semibold">{appliedCoupon.code} applied</p>
                    <p className="text-xs">
                      You save {formatKES(discountAmount)} on this order.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="rounded-full p-1 text-emerald-700 transition-colors hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatKES(cartTotal)}</span></div>
              <div className="flex justify-between text-sm">
                <span>Shipping {shippingRuleName ? `(${shippingRuleName})` : ""}</span>
                <span className={shippingCost === 0 ? "text-green-600" : ""}>
                  {isShippingQuoting ? "Calculating..." : shippingCost === 0 ? "Free" : formatKES(shippingCost)}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-{formatKES(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-border pt-2"><span>Total</span><span>{formatKES(finalTotal)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerStep({ data, onNext }: { data?: CustomerData; onNext: (data: CustomerData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerData>({
    resolver: zodResolver(customerSchema),
    defaultValues: data,
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Contact Information</h2>
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input {...register("firstName")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input {...register("lastName")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input {...register("email")} type="email" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500" />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input {...register("phone")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="+254 7XX XXX XXX" />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
        </div>

        <div className="flex items-center space-x-3 py-2">
          <input
            id="checkout-newsletter"
            type="checkbox"
            defaultChecked={true}
            className="h-5 w-5 rounded border-border bg-background text-brand-500 focus:ring-brand-500/20"
            {...register("wantsNewsletter")}
          />
          <label htmlFor="checkout-newsletter" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
            Get notified on more offers, discounts & new arrivals
          </label>
        </div>

        <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Continue to Shipping</button>
      </form>
    </div>
  );
}

function ShippingStep({ data, onNext }: { data?: ShippingData; onNext: (data: ShippingData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: data,
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Shipping Address</h2>
      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">County</label>
          <select
            {...register("county")}
            className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground dark:bg-[#1f1f1f] dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="" className="bg-background text-foreground dark:bg-[#1f1f1f] dark:text-white">Select county...</option>
            {KENYA_COUNTIES.map((county, index) => (
              <option key={`${county}-${index}`} value={county} className="bg-background text-foreground dark:bg-[#1f1f1f] dark:text-white">
                {county}
              </option>
            ))}
          </select>
          {errors.county && <p className="text-xs text-destructive mt-1">{errors.county.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Street Address</label>
          <input {...register("address")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="123 Ngong Road" />
          {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">City / Town / Area</label>
          <input
            {...register("city")}
            className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. Nairobi, Mombasa, Eldoret, Nakuru"
          />
          {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Delivery Notes (Optional)</label>
          <textarea {...register("deliveryNotes")} rows={3} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Any special delivery instructions..." />
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="font-semibold text-green-700 dark:text-green-400">Free Delivery to Nairobi</p>
          <p className="text-green-600 dark:text-green-500 text-sm mt-1">1-2 business days. Same-day delivery is available for orders before 12pm.</p>
        </div>
        <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Continue to Payment</button>
      </form>
    </div>
  );
}

function PaymentStep({
  data,
  onNext,
  finalTotal,
  isPaystackReady,
  paystackError,
}: {
  data?: PaymentData;
  onNext: (data: PaymentData) => void;
  finalTotal: number;
  isPaystackReady: boolean;
  paystackError: string | null;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: data?.method || "mpesa", ...data },
  });

  const paymentMethod = watch("method");

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Payment Method</h2>
      <div className="mb-5 rounded-2xl border border-emerald-200/60 bg-emerald-50/70 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Paystack popup checkout</p>
        <p className="mt-1 text-sm text-emerald-700/80">M-Pesa opens first and card remains available inside the same secure flow.</p>
        <p className="mt-2 text-xs text-muted-foreground">{isPaystackReady ? "Paystack is loaded and ready." : paystackError || "Loading Paystack checkout for this step."}</p>
      </div>

      <form onSubmit={handleSubmit(onNext)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === "mpesa" ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-border hover:border-muted-foreground"}`}>
            <input {...register("method")} type="radio" value="mpesa" className="accent-green-500" />
            <Smartphone className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-semibold text-sm">M-Pesa</p>
              <p className="text-xs text-muted-foreground">Safaricom via Paystack</p>
            </div>
          </label>
          <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === "card" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-border hover:border-muted-foreground"}`}>
            <input {...register("method")} type="radio" value="card" className="accent-blue-500" />
            <CreditCard className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-semibold text-sm">Card</p>
              <p className="text-xs text-muted-foreground">Visa / Mastercard</p>
            </div>
          </label>
        </div>

        {paymentMethod === "mpesa" && (
          <div>
            <label className="block text-sm font-medium mb-2">M-Pesa Phone Number</label>
            <input {...register("mpesaPhone")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="+254 7XX XXX XXX" />
            {errors.mpesaPhone && <p className="text-xs text-destructive mt-1">{errors.mpesaPhone.message}</p>}
            <p className="text-xs text-muted-foreground mt-1.5">Paystack will send the M-Pesa prompt to this number for {formatKES(finalTotal)}.</p>
          </div>
        )}

        {paymentMethod === "card" && (
          <div className="space-y-3 p-4 border border-border rounded-xl">
            <p className="text-sm text-muted-foreground text-center">Card payments run on Paystack&apos;s secure popup checkout.</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>- Secure SSL encryption</p>
              <p>- PCI DSS compliant</p>
              <p>- M-Pesa remains available from the same Paystack flow</p>
            </div>
          </div>
        )}

        <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">Review Order</button>
      </form>
    </div>
  );
}

function ReviewStep({
  data,
  items,
  finalTotal,
  shippingCost,
  shippingRuleName,
  discountAmount,
  appliedCouponCode,
  isProcessing,
  isShippingQuoting,
  errorMessage,
  paystackReady,
  paystackError,
  onNext,
}: {
  data: CheckoutData;
  items: ReturnType<typeof useCartStore.getState>["items"];
  finalTotal: number;
  shippingCost: number;
  shippingRuleName: string | null;
  discountAmount: number;
  appliedCouponCode: string | null;
  isProcessing: boolean;
  isShippingQuoting: boolean;
  errorMessage?: string | null;
  paystackReady: boolean;
  paystackError: string | null;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Review Your Order</h2>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Contact Information</h3>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p>{data.customer?.firstName} {data.customer?.lastName}</p>
            <p>{data.customer?.email}</p>
            <p>{data.customer?.phone}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Shipping Address</h3>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p>{data.shipping?.address}</p>
            <p>
              {data.shipping?.city}, {data.shipping?.county}
            </p>
            {data.shipping?.deliveryNotes && <p className="mt-2 text-muted-foreground">{data.shipping.deliveryNotes}</p>}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Payment Method</h3>
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="flex items-center gap-2">
              {data.payment?.method === "mpesa" ? (
                <>
                  <Smartphone className="w-4 h-4 text-green-500" />
                  M-Pesa {data.payment.mpesaPhone ? `(${data.payment.mpesaPhone})` : ""}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  Card Payment
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">Paystack opens in a popup with M-Pesa available first and card still enabled.</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Order Items</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.variant.id} className="flex gap-3 p-3 border border-border rounded-xl">
                <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{item.variant.color} | Size {item.variant.size} | Qty {item.quantity}</p>
                  <p className="font-bold text-brand-600 text-sm mt-1">{formatKES(item.variant.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {appliedCouponCode && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Discount ({appliedCouponCode})</span>
            <span>-{formatKES(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>Shipping {shippingRuleName ? `(${shippingRuleName})` : ""}</span>
          <span className={shippingCost === 0 ? "text-green-600" : ""}>
            {shippingCost === 0 ? "Free" : formatKES(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>{formatKES(finalTotal)}</span></div>
      </div>

      <div className={`mt-6 rounded-2xl border p-4 text-sm ${paystackReady ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
        <p className="font-semibold flex items-center gap-2">
          {paystackReady ? <CheckCircle className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
          {paystackReady ? "Paystack popup ready" : "Preparing Paystack"}
        </p>
        <p className="mt-1">{paystackReady ? "Your final click opens Paystack immediately and keeps M-Pesa available by default." : paystackError || "Paystack is still loading. Wait a moment before placing the order."}</p>
      </div>

      {errorMessage && <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{errorMessage}</div>}

      <button onClick={onNext} disabled={isProcessing || !paystackReady || isShippingQuoting} className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6">
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Opening Paystack...
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            Pay with Paystack | {formatKES(finalTotal)}
          </>
        )}
      </button>

      {data.payment?.method === "mpesa" && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 mt-4 text-sm">
          <p className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Your M-Pesa STK prompt will appear inside Paystack after you confirm.
          </p>
        </div>
      )}
    </div>
  );
}
