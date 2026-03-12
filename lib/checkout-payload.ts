import type { AppliedCoupon } from "@/types";

export type CheckoutCartItem = {
  product: { id: string };
  variant: { id: string; price: number; stock: number };
  quantity: number;
};

export function normalizeCheckoutPhoneNumber(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return trimmed;
  }

  if (digits.startsWith("254")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+254${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith("7")) {
    return `+254${digits}`;
  }

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  return trimmed;
}

export function getCheckoutCartValidationError(items: CheckoutCartItem[]) {
  if (items.length === 0) {
    return "Your cart is empty.";
  }

  for (const [index, item] of items.entries()) {
    const itemLabel = `Cart item ${index + 1}`;

    if (!item.product?.id?.trim()) {
      return `${itemLabel} is missing its product ID. Refresh your cart and try again.`;
    }

    if (!item.variant?.id?.trim()) {
      return `${itemLabel} is missing its variant. Refresh your cart and try again.`;
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return `${itemLabel} has an invalid quantity.`;
    }

    if (!Number.isInteger(item.variant.price) || item.variant.price <= 0) {
      return `${itemLabel} has an invalid price. Refresh your cart and try again.`;
    }

    if (!Number.isInteger(item.variant.stock) || item.variant.stock < item.quantity) {
      return `${itemLabel} is no longer available in the requested quantity.`;
    }
  }

  return null;
}

export type CustomerData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type ShippingData = {
  address: string;
  city: string;
  deliveryNotes?: string;
};

export type PaymentData = {
  method: "mpesa" | "card";
  mpesaPhone?: string;
};

export type CheckoutData = {
  customer?: CustomerData;
  shipping?: ShippingData;
  payment?: PaymentData;
  coupon?: AppliedCoupon;
};

export function isCheckoutDataComplete(
  data: CheckoutData
): data is CheckoutData & {
  customer: CustomerData;
  shipping: ShippingData;
  payment: PaymentData;
} {
  return Boolean(data.customer && data.shipping && data.payment);
}

export function buildCheckoutPayload(input: {
  items: CheckoutCartItem[];
  checkoutData: CheckoutData;
  total: number;
}) {
  const { items, checkoutData, total } = input;

  if (!isCheckoutDataComplete(checkoutData) || getCheckoutCartValidationError(items)) {
    return null;
  }

  return {
    items: items.map((item) => ({
      productId: item.product.id.trim(),
      variantId: item.variant.id.trim(),
      quantity: item.quantity,
      price: item.variant.price,
      stock: item.variant.stock,
    })),
    firstName: checkoutData.customer.firstName.trim(),
    lastName: checkoutData.customer.lastName.trim(),
    email: checkoutData.customer.email.trim().toLowerCase(),
    phone: normalizeCheckoutPhoneNumber(checkoutData.customer.phone),
    address: checkoutData.shipping.address.trim(),
    city: checkoutData.shipping.city.trim(),
    notes: checkoutData.shipping.deliveryNotes?.trim(),
    paymentMethod: checkoutData.payment.method,
    mpesaPhone: normalizeCheckoutPhoneNumber(checkoutData.payment.mpesaPhone),
    ...(checkoutData.coupon?.code ? { couponCode: checkoutData.coupon.code } : {}),
    total,
  };
}
