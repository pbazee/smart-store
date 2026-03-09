"use client";
import { useState } from "react";
import { useCartStore } from "@/lib/store";
import { formatKES } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Smartphone, CreditCard, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid Kenyan phone number required"),
  address: z.string().min(5, "Address required"),
  city: z.string().min(2, "City required"),
  paymentMethod: z.enum(["mpesa", "card"]),
  mpesaPhone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const steps = ["Contact", "Shipping", "Payment", "Confirm"];

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [orderNumber] = useState(`SSK-${Math.floor(Math.random() * 9000 + 1000)}`);
  const { items, total, clearCart } = useCartStore();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "mpesa" },
  });

  const paymentMethod = watch("paymentMethod");
  const cartTotal = total();

  if (items.length === 0 && !complete) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-lg font-bold mb-4">Your cart is empty</p>
        <Link href="/shop" className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-bold">
          Shop Now
        </Link>
      </div>
    );
  }

  if (complete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto px-4 py-20 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>
        <h1 className="text-3xl font-black mb-3">Order Placed! 🎉</h1>
        <p className="text-muted-foreground mb-6">
          Your order <span className="font-bold text-foreground">{orderNumber}</span> has been placed successfully.
          You&apos;ll receive an M-Pesa prompt shortly.
        </p>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 text-sm">
          <p className="font-semibold text-green-700 dark:text-green-400">📱 M-Pesa Payment Prompt Sent</p>
          <p className="text-green-600 dark:text-green-500 mt-1">Check your phone and enter your M-Pesa PIN to complete payment.</p>
        </div>
        <Link href="/shop" className="inline-block px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors">
          Continue Shopping
        </Link>
      </motion.div>
    );
  }

  const onSubmit = (data: FormData) => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      clearCart();
      setComplete(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-black mb-8">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < step ? "bg-green-500 text-white" : i === step ? "bg-brand-500 text-white" : "bg-muted text-muted-foreground"
            }`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="font-bold text-lg">Contact Information</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">First Name</label>
                      <input {...register("firstName")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="John" />
                      {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Last Name</label>
                      <input {...register("lastName")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="Doe" />
                      {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email</label>
                    <input {...register("email")} type="email" className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="john@email.com" />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                    <input {...register("phone")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="+254 7XX XXX XXX" />
                    {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="shipping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="font-bold text-lg">Shipping Address</h2>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Street Address</label>
                    <input {...register("address")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="123 Ngong Road" />
                    {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">City / Area</label>
                    <select {...register("city")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm">
                      <option value="">Select area...</option>
                      {["Nairobi CBD", "Westlands", "Karen", "Lavington", "Kilimani", "Eastlands", "Thika Road", "Mombasa Road", "Other Nairobi"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl text-sm">
                    <p className="font-semibold text-green-700 dark:text-green-400">🚚 Free Delivery to Nairobi</p>
                    <p className="text-green-600 dark:text-green-500 mt-1">1-2 business days. Same-day delivery available for orders before 12pm.</p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="font-bold text-lg">Payment Method</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === "mpesa" ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-border hover:border-muted-foreground"}`}>
                      <input {...register("paymentMethod")} type="radio" value="mpesa" className="accent-green-500" />
                      <Smartphone className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-semibold text-sm">M-Pesa</p>
                        <p className="text-xs text-muted-foreground">Safaricom</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === "card" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-border hover:border-muted-foreground"}`}>
                      <input {...register("paymentMethod")} type="radio" value="card" className="accent-blue-500" />
                      <CreditCard className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-semibold text-sm">Card</p>
                        <p className="text-xs text-muted-foreground">Visa / Mastercard</p>
                      </div>
                    </label>
                  </div>

                  {paymentMethod === "mpesa" && (
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">M-Pesa Phone Number</label>
                      <input {...register("mpesaPhone")} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder="+254 7XX XXX XXX" />
                      <p className="text-xs text-muted-foreground mt-1.5">You&apos;ll receive a payment prompt on this number</p>
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="space-y-3 p-4 border border-border rounded-xl">
                      <p className="text-sm text-muted-foreground text-center">🔒 Demo Mode — Card payments will be enabled when connected to Paystack/Stripe</p>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="font-bold text-lg">Confirm Order</h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.variant.id} className="flex gap-3 p-3 border border-border rounded-xl">
                        <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="64px" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">{item.variant.color} · Size {item.variant.size} · Qty {item.quantity}</p>
                          <p className="font-bold text-brand-600 text-sm mt-1">{formatKES(item.variant.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-3 border border-border rounded-xl font-semibold hover:bg-muted transition-colors">
                  Back
                </button>
              )}
              <button type="submit" className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                {step === 3 ? (
                  <><Lock className="w-4 h-4" /> Place Order · {formatKES(cartTotal)}</>
                ) : (
                  <>Continue <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border border-border rounded-2xl p-5 bg-card sticky top-20">
            <h3 className="font-bold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.variant.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="48px" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.variant.size}</p>
                  </div>
                  <p className="text-sm font-bold">{formatKES(item.variant.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-brand-600">{formatKES(cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
