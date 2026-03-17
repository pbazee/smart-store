import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  reserveCouponUsage,
  validateCouponForSubtotal,
} from "@/lib/coupon-service";
import {
  getCheckoutCartValidationError,
  normalizeCheckoutPhoneNumber,
} from "@/lib/checkout-payload";
import {
  getReservationExpiryDate,
  releaseExpiredReservations,
  releaseExpiredReservationsInTransaction,
  releaseReservationForReference,
} from "@/lib/order-reservations";
import { initializePaystackTransaction } from "@/lib/paystack";
import { getSessionUser } from "@/lib/session-user";
import { getShippingQuote } from "@/lib/shipping-rules";
import crypto from "crypto";
import { z } from "zod";

const initializePaymentSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().trim().min(1),
          variantId: z.string().trim().min(1),
          quantity: z.number().int().positive(),
          price: z.number().int().positive(),
          stock: z.number().int().nonnegative(),
        })
      )
      .min(1),
    firstName: z.string().trim().min(2),
    lastName: z.string().trim().min(2),
    email: z.string().trim().email(),
    phone: z.string().trim().min(10),
    address: z.string().trim().min(5),
    city: z.string().trim().min(2),
    county: z.string().trim().min(2),
    notes: z.string().optional(),
    paymentMethod: z.enum(["mpesa", "card"]),
    mpesaPhone: z.string().optional(),
    couponCode: z.string().optional(),
    total: z.number().int().positive().optional(),
  })
  .superRefine((data, context) => {
    const seenVariantIds = new Set<string>();

    data.items.forEach((item, index) => {
      if (seenVariantIds.has(item.variantId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "variantId"],
          message: "Duplicate cart item detected",
        });
      }

      seenVariantIds.add(item.variantId);

      if (item.stock < item.quantity) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "quantity"],
          message: "Requested quantity exceeds available stock",
        });
      }
    });

    if (data.paymentMethod === "mpesa" && (!data.mpesaPhone || data.mpesaPhone.trim().length < 10)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mpesaPhone"],
        message: "Valid M-Pesa phone number required",
      });
    }
  });

function generateOrderNumber() {
  return `SSK-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(2)
    .toString("hex")
    .toUpperCase()}`;
}

function generateReference(orderNumber: string) {
  return `${orderNumber}-${crypto.randomBytes(6).toString("hex")}`;
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id ?? null;

    await releaseExpiredReservations();

    const body = await req.json();
    const validatedData = initializePaymentSchema.parse(body);
    const cartValidationError = getCheckoutCartValidationError(
      validatedData.items.map((item) => ({
        product: { id: item.productId },
        variant: { id: item.variantId, price: item.price, stock: item.stock },
        quantity: item.quantity,
      }))
    );

    if (cartValidationError) {
      return NextResponse.json({ error: cartValidationError }, { status: 400 });
    }

    const requestedVariantIds = [...new Set(validatedData.items.map((item) => item.variantId))];
    const variants = await prisma.variant.findMany({
      where: { id: { in: requestedVariantIds } },
      include: { product: true },
    });

    if (variants.length !== requestedVariantIds.length) {
      return NextResponse.json({ error: "One or more cart items are invalid" }, { status: 400 });
    }

    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
    const resolvedItems = validatedData.items.map((item) => {
      const variant = variantMap.get(item.variantId);
      if (!variant || variant.productId !== item.productId) {
        throw new Error("Invalid product selection");
      }

      if (variant.price !== item.price) {
        throw new Error("Cart pricing has changed. Please review your cart and try again.");
      }

      if (variant.stock < item.quantity) {
        throw new Error("Some items are no longer available in the requested quantity");
      }

      return {
        productId: variant.productId,
        variantId: variant.id,
        productName: variant.product.name,
        price: variant.price,
        quantity: item.quantity,
      };
    });

    const subtotal = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Parallelize coupon and shipping queries instead of sequential
    const [appliedCoupon, shippingQuote] = await Promise.all([
      validatedData.couponCode
        ? validateCouponForSubtotal({
            code: validatedData.couponCode,
            subtotal,
          })
        : Promise.resolve(null),
      getShippingQuote({
        subtotal,
        county: validatedData.county,
        city: validatedData.city,
      }),
    ]);
    
    const discountAmount = appliedCoupon?.discountAmount ?? 0;
    const shippingCost = shippingQuote.cost;
    const computedTotal = subtotal + shippingCost - discountAmount;

    if (validatedData.total !== undefined && validatedData.total !== computedTotal) {
      return NextResponse.json(
        { error: "Order total is out of date. Please review your cart and try again." },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();
    const reference = generateReference(orderNumber);
    const reservationCreatedAt = new Date();
    const reservationExpiresAt = getReservationExpiryDate(reservationCreatedAt);
    const customerPhone = normalizeCheckoutPhoneNumber(validatedData.phone);
    const mpesaPhone = normalizeCheckoutPhoneNumber(validatedData.mpesaPhone || validatedData.phone);
    const callbackUrl = `${
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || req.nextUrl.origin
    }/checkout/paystack-callback?reference=${encodeURIComponent(reference)}`;
    const channels =
      validatedData.paymentMethod === "mpesa"
        ? (["mobile_money", "card"] as const)
        : (["card", "mobile_money"] as const);

    const order = await prisma.$transaction(async (tx) => {
      await releaseExpiredReservationsInTransaction(tx);

      if (userId && sessionUser) {
        await tx.user.upsert({
          where: { id: userId },
          update: {
            email: sessionUser.email ?? validatedData.email,
            firstName: sessionUser.firstName ?? validatedData.firstName,
            lastName: sessionUser.lastName ?? validatedData.lastName,
            fullName:
              sessionUser.fullName ??
              `${validatedData.firstName} ${validatedData.lastName}`,
          },
          create: {
            id: userId,
            email: sessionUser.email ?? validatedData.email,
            firstName: sessionUser.firstName ?? validatedData.firstName,
            lastName: sessionUser.lastName ?? validatedData.lastName,
            fullName:
              sessionUser.fullName ??
              `${validatedData.firstName} ${validatedData.lastName}`,
          },
        });
      }

      for (const item of resolvedItems) {
        const reserved = await tx.variant.updateMany({
          where: {
            id: item.variantId,
            productId: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (reserved.count === 0) {
          throw new Error("Some items are no longer available in the requested quantity");
        }
      }

      await reserveCouponUsage(tx, appliedCoupon?.code);

      return tx.order.create({
        data: {
          userId,
          orderNumber,
          customerName: `${validatedData.firstName} ${validatedData.lastName}`,
          customerEmail: validatedData.email,
          customerPhone,
          address: validatedData.address,
          city: validatedData.city,
          county: validatedData.county,
          notes: validatedData.notes || "",
          paymentMethod: validatedData.paymentMethod,
          subtotal,
          shippingAmount: shippingCost,
          shippingRuleName: shippingQuote.ruleName,
          shippingRuleId: shippingQuote.ruleId ?? null,
          discountAmount,
          couponCode: appliedCoupon?.code ?? null,
          total: computedTotal,
          status: "pending",
          paymentStatus: "pending",
          paystackReference: reference,
          stockReservedAt: reservationCreatedAt,
          reservationExpiresAt,
          items: {
            create: resolvedItems,
          },
        },
        include: { items: true },
      });
    });
    let paystackTransaction;

    try {
      paystackTransaction = await initializePaystackTransaction({
        email: validatedData.email,
        amountInSubunit: computedTotal * 100,
        reference,
        callbackUrl,
        channels: [...channels],
        metadata: {
          orderId: order.id,
          orderNumber,
          customerName: `${validatedData.firstName} ${validatedData.lastName}`,
          customerPhone,
          mpesaPhone,
          paymentMethod: validatedData.paymentMethod,
          couponCode: appliedCoupon?.code,
          discountAmount,
          cartItems: resolvedItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
          })),
          custom_fields: [
            {
              display_name: "Order Number",
              variable_name: "order_number",
              value: orderNumber,
            },
            {
              display_name: "Preferred Payment",
              variable_name: "preferred_payment",
              value: validatedData.paymentMethod === "mpesa" ? "M-Pesa" : "Card",
            },
            {
              display_name: "Coupon",
              variable_name: "coupon_code",
              value: appliedCoupon?.code ?? "None",
            },
            {
              display_name: "M-Pesa Phone",
              variable_name: "mpesa_phone",
              value: mpesaPhone,
            },
          ],
        },
      });
    } catch (error) {
      // Log Paystack-specific errors for debugging
      console.error("Paystack initialization failed:", {
        orderId: order.id,
        orderNumber,
        reference,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      // Release the reservation since payment initialization failed
      await releaseReservationForReference(reference);
      
      // Re-throw with clear message for client
      const message = error instanceof Error ? error.message : "Failed to initialize Paystack payment";
      throw new Error(message);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          reference,
          reservationExpiresAt,
          paystack: {
            authorizationUrl: paystackTransaction.authorizationUrl,
            accessCode: paystackTransaction.accessCode,
            reference: paystackTransaction.reference,
            callbackUrl,
            channels,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    // Log the actual error for debugging
    console.error("Payment initialization error:", error);

    // Handle Prisma connection errors gracefully
    if (error instanceof Prisma.PrismaClientInitializationError) {
      // In development, provide detailed error message
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
          {
            error: "Database connection failed",
            details: "Check your DATABASE_URL and DIRECT_URL environment variables in .env.local",
            debug: error.message,
          },
          { status: 503 }
        );
      }

      // In production, log but show generic message
      console.error("[CRITICAL] Database initialization failed:", {
        timestamp: new Date().toISOString(),
        error: error.message,
      });

      return NextResponse.json(
        {
          error: "Temporary service unavailable. Please refresh and try again.",
        },
        { status: 503 }
      );
    }

    // Handle other errors
    const message = error instanceof Error ? error.message : "Failed to initialize payment";
    const status =
      error instanceof Error &&
      (message.includes("out of stock") ||
        message.toLowerCase().includes("coupon") ||
        message.includes("Invalid product selection") ||
        message.includes("requested quantity") ||
        message.includes("Cart pricing"))
        ? 409
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
