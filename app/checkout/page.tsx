"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Loader2,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import {
  buildCheckoutPayload,
  getCheckoutCartValidationError,
  type CheckoutData,
  type CustomerData,
  type PaymentData,
  type ShippingData,
} from "@/lib/checkout-payload";
import { KENYA_COUNTIES } from "@/lib/kenya-counties";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/lib/use-toast";
import { cn, formatKES } from "@/lib/utils";

const customerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid Kenyan phone number required"),
  subscribeToNewsletter: z.boolean().default(true),
});

const shippingSchema = z.object({
  county: z.string().min(2, "County is required"),
  city: z.string().min(2, "Town / area is required"),
  address: z.string().min(5, "Street address is required"),
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
  publicKey: string;
  channels: PaystackChannel[];
};

type ShippingQuoteState = {
  county: string;
  cost: number;
  estimatedDays: number;
  noMatch: boolean;
  ruleName: string | null;
  freeAboveKES: number | null;
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

type CouponValidationResponse = {
  valid: boolean;
  code?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  description?: string;
  error?: string;
};

const PAYSTACK_COMPLETE_MESSAGE = "paystack:complete";
const GENERIC_PAYMENT_ERROR = "Payment failed. Please try again.";
const checkoutFieldClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-500";
const checkoutSelectClass =
  "w-full cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100";
const checkoutLabelClass =
  "text-[11px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300";
const checkoutCardClass = "rounded-[2rem] border border-border bg-card p-6 shadow-sm";

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

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-medium text-red-500">{message}</p>;
}

async function validateCouponRequest(input: {
  code: string;
  orderTotal: number;
}): Promise<NonNullable<CheckoutData["coupon"]>> {
  const response = await fetch("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json().catch(() => null)) as CouponValidationResponse | null;
  if (
    !response.ok ||
    !data?.valid ||
    !data.code ||
    !data.discountType ||
    typeof data.discountValue !== "number" ||
    typeof data.discountAmount !== "number"
  ) {
    throw new Error(data?.error || "Unable to validate that coupon right now.");
  }

  return {
    code: data.code,
    discountType: data.discountType,
    discountValue: data.discountValue,
    discountAmount: data.discountAmount,
    description: data.description,
  };
}

export default function CheckoutPage() {
  const { hasHydrated, items, cartTotal } = useCartStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      items: state.items,
      cartTotal: state.items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0),
    }))
  );
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
  const [shippingQuote, setShippingQuote] = useState<ShippingQuoteState | null>(null);
  const [shippingRuleName, setShippingRuleName] = useState<string | null>(null);
  const [isShippingQuoting, setIsShippingQuoting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const appliedCoupon = checkoutData.coupon ?? null;
  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.discountAmount, cartTotal) : 0;
  const shippingCost = shippingQuote?.cost ?? 0;
  const shippingSubtotal = Math.max(0, cartTotal - discountAmount);
  const finalTotal = cartTotal + shippingCost - discountAmount;

  const refreshShippingQuote = async (shippingData: ShippingData) => {
    if (!shippingData.county) {
      setShippingQuote(null);
      setShippingRuleName(null);
      return;
    }

    setIsShippingQuoting(true);
    try {
      const response = await fetch("/api/checkout/shipping-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal: shippingSubtotal,
          city: shippingData.city,
          county: shippingData.county,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch shipping");
      }

      setShippingQuote({
        county: shippingData.county,
        cost: data.data?.cost ?? 0,
        estimatedDays: data.data?.estimatedDays ?? 0,
        noMatch: Boolean(data.data?.noMatch),
        ruleName: data.data?.ruleName ?? null,
        freeAboveKES: data.data?.freeAboveKES ?? null,
      });
      setShippingRuleName(data.data?.ruleName ?? null);
    } catch (error) {
      console.error("Shipping quote failed:", error);
      setShippingQuote({
        county: shippingData.county,
        cost: 0,
        estimatedDays: 0,
        noMatch: true,
        ruleName: null,
        freeAboveKES: null,
      });
      setShippingRuleName(null);
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
      const parsed = JSON.parse(saved) as CheckoutData & {
        customer?: CustomerData & { wantsNewsletter?: boolean };
      };
      const savedNewsletterValue =
        parsed.customer?.subscribeToNewsletter ?? parsed.customer?.wantsNewsletter ?? true;

      setCheckoutData({
        ...parsed,
        customer: parsed.customer
          ? {
              ...parsed.customer,
              subscribeToNewsletter: savedNewsletterValue,
            }
          : parsed.customer,
      });
      setCouponCode(parsed.coupon?.code ?? "");
      setCouponError(null);
    } catch (error) {
      console.error("Failed to parse checkout data", error);
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
        const refreshedCoupon = await validateCouponRequest({
          code: checkoutData.coupon!.code,
          orderTotal: cartTotal,
        });

        if (!cancelled) {
          setCheckoutData((previous) => ({ ...previous, coupon: refreshedCoupon }));
          setCouponCode(refreshedCoupon.code);
          setCouponError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setCheckoutData((previous) => ({ ...previous, coupon: undefined }));
          setCouponCode("");
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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Enter a coupon code.");
      return;
    }

    if (cartTotal <= 0) {
      setCouponError("Add products to your cart before applying a coupon.");
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const validatedCoupon = await validateCouponRequest({
        code: couponCode.trim().toUpperCase(),
        orderTotal: cartTotal,
      });

      setCheckoutData((previous) => ({ ...previous, coupon: validatedCoupon }));
      setCouponCode(validatedCoupon.code);
      toast({
        title: "Coupon applied",
        description: validatedCoupon.description || `${validatedCoupon.code} is now active.`,
      });
    } catch (error) {
      setCheckoutData((previous) => ({ ...previous, coupon: undefined }));
      setCouponError(
        error instanceof Error ? error.message : "That coupon could not be applied."
      );
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCheckoutData((previous) => ({ ...previous, coupon: undefined }));
    setCouponCode("");
    setCouponError(null);
  };

  useEffect(() => {
    if (!checkoutData.shipping?.county) {
      return;
    }

    void refreshShippingQuote(checkoutData.shipping);
  }, [checkoutData.shipping, shippingSubtotal]);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim();
    setIsPaystackReady(Boolean(publicKey));
    setPaystackError(publicKey ? null : "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is missing.");

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
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    void handlePlaceOrder();
  };

  const handlePaymentAbort = async (reference?: string) => {
    await releasePendingCheckout(reference);
    clearPopupWatcher();
    localStorage.removeItem("pending-checkout");
    setIsProcessing(false);
    setCheckoutError(GENERIC_PAYMENT_ERROR);
    toast({
      title: "Payment failed",
      description: GENERIC_PAYMENT_ERROR,
      variant: "destructive",
    });
  };

  const handlePlaceOrder = async () => {
    const cartValidationError = getCheckoutCartValidationError(items);
    if (cartValidationError) {
      setCheckoutError(cartValidationError);
      toast({
        title: "Cart needs attention",
        description: cartValidationError,
        variant: "destructive",
      });
      return;
    }

    const payload = buildCheckoutPayload({ items, checkoutData, total: finalTotal });
    if (!payload) {
      const message = "Complete all checkout details before placing the order.";
      setCheckoutError(message);
      toast({ title: "Incomplete checkout", description: message, variant: "destructive" });
      return;
    }

    if (!isPaystackReady) {
      setCheckoutError(paystackError || GENERIC_PAYMENT_ERROR);
      toast({
        title: "Payment failed",
        description: paystackError || GENERIC_PAYMENT_ERROR,
        variant: "destructive",
      });
      return;
    }

    setCheckoutError(null);
    setIsProcessing(true);
    const popupWindow = window.open("", "paystack_checkout", getPaystackPopupFeatures());

    try {
      const response = await fetch("/api/checkout/initialize-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as InitializePaymentResponse;
      if (!response.ok || !data.data) {
        throw new Error(data.error || "Payment initialization failed");
      }

      if (!data.data.paystack.publicKey) {
        throw new Error("Paystack public key is missing.");
      }

      localStorage.setItem(
        "pending-checkout",
        JSON.stringify({
          orderId: data.data.orderId,
          orderNumber: data.data.orderNumber,
          reference: data.data.reference,
          paymentMethod: checkoutData.payment?.method,
          publicKey: data.data.paystack.publicKey,
        })
      );

      if (popupWindow) {
        popupWindow.location.href = data.data.paystack.authorizationUrl;
      }

      popupStateRef.current = {
        completed: false,
        popup: popupWindow,
        reference: data.data.reference,
        closeWatcherId: window.setInterval(() => {
          if (popupWindow?.closed && !popupStateRef.current.completed) {
            void handlePaymentAbort(data.data?.reference);
          }
        }, 1000),
      };
    } catch (error) {
      if (popupWindow) {
        popupWindow.close();
      }
      console.error("Checkout payment initialization failed:", error);
      await handlePaymentAbort();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <CustomerStep data={checkoutData.customer} onNext={handleNext} />;
      case 1:
        return (
          <ShippingStep
            data={checkoutData.shipping}
            onNext={handleNext}
            shippingSubtotal={shippingSubtotal}
            shippingQuote={shippingQuote}
            isShippingQuoting={isShippingQuoting}
            onCountyPreview={refreshShippingQuote}
          />
        );
      case 2:
        return (
          <PaymentStep
            data={checkoutData.payment}
            customerPhone={checkoutData.customer?.phone}
            finalTotal={finalTotal}
            onNext={handleNext}
            isPaystackReady={isPaystackReady}
            paystackError={paystackError}
          />
        );
      case 3:
        return (
          <ReviewStep
            data={checkoutData}
            finalTotal={finalTotal}
            shippingQuote={shippingQuote}
            shippingRuleName={shippingRuleName}
            discountAmount={discountAmount}
            errorMessage={checkoutError}
            isProcessing={isProcessing}
            onNext={() => handleNext()}
          />
        );
      default:
        return null;
    }
  };

  if (!hasHydrated) {
    return <div className="p-20 text-center text-foreground">Loading checkout...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Secure checkout with county-based delivery across Kenya.
          </p>
        </div>
        <div className="rounded-full border border-border bg-card px-4 py-2 text-xs font-black uppercase tracking-widest text-foreground">
          Step {currentStep + 1} / 4
        </div>
      </div>

      <div className="mb-8 grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "rounded-[1.5rem] border px-4 py-4 transition",
              index === currentStep
                ? "border-orange-500 bg-orange-500/10"
                : index < currentStep
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-border bg-card"
            )}
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              Step {index + 1}
            </p>
            <p className="mt-2 text-sm font-black text-foreground">{step.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">{renderStepContent()}</div>

        <aside className="space-y-6">
          <div className="sticky top-[calc(var(--storefront-header-height,104px)+1rem)] rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-black text-foreground">Order Summary</h2>

            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.variant.id} className="flex gap-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-border">
                    <Image src={item.product.images[0]} alt="" fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variant.color} | {item.variant.size} | Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-black text-foreground">
                    {formatKES(item.variant.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm font-medium text-foreground">Coupon code</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => void handleApplyCoupon()}
                  disabled={isValidatingCoupon || !couponCode.trim()}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {isValidatingCoupon ? "..." : "Apply"}
                </button>
              </div>
              {couponError ? <p className="mt-1 text-xs text-red-500">{couponError}</p> : null}
              {appliedCoupon ? (
                <div className="mt-2 flex items-center justify-between gap-3 text-sm text-green-600 dark:text-green-400">
                  <span>
                    "{appliedCoupon.code}" applied
                    {appliedCoupon.description ? ` - ${appliedCoupon.description}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs text-muted-foreground underline"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-3 border-t border-border pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-black text-foreground">{formatKES(cartTotal)}</span>
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span className="font-black">-{formatKES(discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-black text-foreground">
                  {shippingQuote?.noMatch
                    ? "To confirm"
                    : shippingCost === 0
                      ? "FREE"
                      : formatKES(shippingCost)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4 text-lg">
                <span className="font-black text-foreground">Total</span>
                <span className="font-black text-foreground">{formatKES(finalTotal)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CustomerStep({
  data,
  onNext,
}: {
  data?: CustomerData;
  onNext: (data: CustomerData) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: data?.firstName || "",
      lastName: data?.lastName || "",
      email: data?.email || "",
      phone: data?.phone || "",
      subscribeToNewsletter: data?.subscribeToNewsletter ?? true,
    },
  });
  const subscribeToNewsletter = watch("subscribeToNewsletter") ?? true;

  useEffect(() => {
    setValue("subscribeToNewsletter", data?.subscribeToNewsletter ?? true, {
      shouldDirty: false,
    });
  }, [data?.subscribeToNewsletter, setValue]);

  return (
    <form onSubmit={handleSubmit(onNext)} className={checkoutCardClass}>
      <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-2">
          <span className={checkoutLabelClass}>First Name</span>
          <input {...register("firstName")} placeholder="Peter" className={checkoutFieldClass} />
          <FieldError message={errors.firstName?.message} />
        </label>

        <label className="space-y-2">
          <span className={checkoutLabelClass}>Last Name</span>
          <input {...register("lastName")} placeholder="Kinuthia" className={checkoutFieldClass} />
          <FieldError message={errors.lastName?.message} />
        </label>
      </div>

      <div className="mt-6 space-y-6">
        <input type="hidden" {...register("subscribeToNewsletter")} />

        <label className="space-y-2">
          <span className={checkoutLabelClass}>Email</span>
          <input
            {...register("email")}
            type="email"
            placeholder="you@example.com"
            className={checkoutFieldClass}
          />
          <FieldError message={errors.email?.message} />
        </label>

        <label className="space-y-2">
          <span className={checkoutLabelClass}>Phone</span>
          <input
            {...register("phone")}
            placeholder="+254700123456"
            className={checkoutFieldClass}
          />
          <FieldError message={errors.phone?.message} />
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={subscribeToNewsletter}
            onChange={(event) =>
              setValue("subscribeToNewsletter", event.target.checked, { shouldDirty: true })
            }
            className="h-4 w-4 rounded accent-orange-500"
          />
          <span className="text-sm text-muted-foreground">
            Get notified on more offers, discounts & new arrivals
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="mt-8 w-full rounded-full bg-orange-500 py-4 text-sm font-black text-white transition hover:bg-orange-600"
      >
        Proceed to Shipping
      </button>
    </form>
  );
}

function ShippingStep({
  data,
  onNext,
  shippingSubtotal,
  shippingQuote,
  isShippingQuoting,
  onCountyPreview,
}: {
  data?: ShippingData;
  onNext: (data: ShippingData) => void;
  shippingSubtotal: number;
  shippingQuote: ShippingQuoteState | null;
  isShippingQuoting: boolean;
  onCountyPreview: (data: ShippingData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: data,
  });

  const county = watch("county");
  const city = watch("city");
  const address = watch("address");

  useEffect(() => {
    if (!county) {
      return;
    }

    void onCountyPreview({
      county,
      city: city || "",
      address: address || "",
      deliveryNotes: data?.deliveryNotes,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, city, county, data?.deliveryNotes]);

  const renderShippingInfo = () => {
    if (!county) {
      return null;
    }

    if (isShippingQuoting) {
      return (
        <div className="mt-4 flex min-h-[72px] items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking delivery fee for {county}...
        </div>
      );
    }

    if (!shippingQuote) {
      return null;
    }

    if (shippingQuote.noMatch) {
      return (
        <div className="mt-4 flex min-h-[72px] items-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          We&apos;ll confirm shipping cost after order.
        </div>
      );
    }

    const isFree =
      typeof shippingQuote.freeAboveKES === "number" &&
      shippingQuote.freeAboveKES > 0 &&
      shippingSubtotal >= shippingQuote.freeAboveKES;

    if (isFree) {
      return (
        <div className="mt-4 flex min-h-[72px] items-center rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
          Free Delivery to {county}
        </div>
      );
    }

    return (
      <div className="mt-4 flex min-h-[72px] items-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
        Delivery to {county}: Ksh {shippingQuote.cost} - {shippingQuote.estimatedDays} business
        days
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className={checkoutCardClass}>
      <label className="space-y-2">
        <span className={checkoutLabelClass}>County</span>
        <select {...register("county")} className={checkoutSelectClass}>
          <option value="">Select county</option>
          {KENYA_COUNTIES.map((countyOption) => (
            <option key={countyOption} value={countyOption}>
              {countyOption}
            </option>
          ))}
        </select>
        <FieldError message={errors.county?.message} />
      </label>

      {renderShippingInfo()}

      <div className="mt-6 space-y-6">
        <label className="space-y-2">
          <span className={checkoutLabelClass}>Town / Area</span>
          <input
            {...register("city")}
            placeholder="Westlands"
            className={checkoutFieldClass}
          />
          <FieldError message={errors.city?.message} />
        </label>

        <label className="space-y-2">
          <span className={checkoutLabelClass}>Street Address</span>
          <input
            {...register("address")}
            placeholder="House, apartment, road"
            className={checkoutFieldClass}
          />
          <FieldError message={errors.address?.message} />
        </label>

        <label className="space-y-2">
          <span className={checkoutLabelClass}>Delivery Notes</span>
          <textarea
            {...register("deliveryNotes")}
            rows={4}
            placeholder="Optional delivery instructions"
            className={checkoutFieldClass}
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-8 w-full rounded-full bg-orange-500 py-4 text-sm font-black text-white transition hover:bg-orange-600"
      >
        Proceed to Payment
      </button>
    </form>
  );
}

function PaymentStep({
  data,
  customerPhone,
  finalTotal,
  onNext,
  isPaystackReady,
  paystackError,
}: {
  data?: PaymentData;
  customerPhone?: string;
  finalTotal: number;
  onNext: (data: PaymentData) => void;
  isPaystackReady: boolean;
  paystackError: string | null;
}) {
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: data ?? {
      method: "mpesa",
      mpesaPhone: customerPhone,
    },
  });

  const method = watch("method");

  useEffect(() => {
    if (!data?.mpesaPhone && customerPhone) {
      setValue("mpesaPhone", customerPhone);
    }
  }, [customerPhone, data?.mpesaPhone, setValue]);

  const paymentOptions: Array<{
    key: PaymentData["method"];
    title: string;
    subtitle: string;
    icon: typeof Smartphone;
  }> = [
    {
      key: "mpesa",
      title: "M-PESA",
      subtitle: "Paystack mobile money",
      icon: Smartphone,
    },
    {
      key: "card",
      title: "CARD",
      subtitle: "Paystack card checkout",
      icon: CreditCard,
    },
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className={checkoutCardClass}>
      <div className="grid gap-4 md:grid-cols-2">
        {paymentOptions.map((option) => {
          const selected = method === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setValue("method", option.key, { shouldValidate: true })}
              className={cn(
                "rounded-[1.75rem] border p-6 text-left transition",
                selected
                  ? "border-orange-500 bg-orange-500/10 text-foreground"
                  : "border-border bg-background text-foreground hover:border-orange-500/50"
              )}
            >
              <option.icon
                className={cn("mb-4 h-8 w-8", selected ? "text-orange-500" : "text-muted-foreground")}
              />
              <p className="text-sm font-black">{option.title}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {option.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      <input type="hidden" {...register("method")} />

      {method === "mpesa" ? (
        <label className="mt-6 block space-y-2">
          <span className={checkoutLabelClass}>M-PESA Phone</span>
          <input
            {...register("mpesaPhone")}
            placeholder="+254700123456"
            className={checkoutFieldClass}
          />
          <FieldError message={errors.mpesaPhone?.message} />
        </label>
      ) : null}

      {!isPaystackReady && paystackError ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {paystackError}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">
          {method === "mpesa"
            ? "You will complete the payment in the Paystack M-PESA flow."
            : "You will complete the payment in the Paystack card popup."}
        </div>
      )}

      <button
        type="submit"
        disabled={!method}
        className="mt-8 w-full rounded-full bg-orange-500 py-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
      >
        Review Order | {formatKES(finalTotal)}
      </button>
    </form>
  );
}

function ReviewStep({
  data,
  finalTotal,
  shippingQuote,
  shippingRuleName,
  discountAmount,
  errorMessage,
  isProcessing,
  onNext,
}: {
  data: CheckoutData;
  finalTotal: number;
  shippingQuote: ShippingQuoteState | null;
  shippingRuleName: string | null;
  discountAmount: number;
  errorMessage: string | null;
  isProcessing: boolean;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className={checkoutCardClass}>
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Customer
          </p>
          <p className="mt-4 text-sm font-bold text-foreground">
            {data.customer?.firstName} {data.customer?.lastName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{data.customer?.email}</p>
          <p className="mt-1 text-sm text-muted-foreground">{data.customer?.phone}</p>
        </div>

        <div className={checkoutCardClass}>
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Shipping
          </p>
          <p className="mt-4 text-sm font-bold text-foreground">
            {data.shipping?.county} - {data.shipping?.city}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{data.shipping?.address}</p>
          {data.shipping?.deliveryNotes ? (
            <p className="mt-1 text-sm text-muted-foreground">{data.shipping.deliveryNotes}</p>
          ) : null}
        </div>
      </div>

      <div className={checkoutCardClass}>
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-full bg-orange-500/10 p-2 text-orange-500">
            <Truck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-foreground">
              {shippingQuote?.noMatch
                ? "We'll confirm shipping cost after order"
                : shippingQuote?.cost === 0
                  ? `Free Delivery to ${shippingQuote.county}`
                  : `Delivery to ${shippingQuote?.county}: ${formatKES(shippingQuote?.cost ?? 0)}`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {shippingQuote?.noMatch
                ? "Your form data stays intact if you need to retry payment."
                : `${shippingQuote?.estimatedDays ?? 0} business days${shippingRuleName ? ` • ${shippingRuleName}` : ""}`}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Payment method:{" "}
              <span className="font-semibold text-foreground">
                {data.payment?.method === "mpesa" ? "M-PESA via Paystack" : "Card via Paystack"}
              </span>
            </p>
            {discountAmount > 0 && data.coupon ? (
              <p className="mt-2 text-sm text-orange-500">
                Discount applied: {data.coupon.code} -{formatKES(discountAmount)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        </div>
      ) : null}

      <button
        onClick={onNext}
        disabled={isProcessing}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-orange-500 py-4 text-sm font-black text-white transition hover:bg-orange-600 disabled:opacity-60"
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Pay with Paystack | {formatKES(finalTotal)}
      </button>

      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Payment success will clear your cart and redirect to your order confirmation page.
        </div>
      </div>
    </div>
  );
}
