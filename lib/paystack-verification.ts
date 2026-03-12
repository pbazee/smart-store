export function getPaystackVerificationError(input: {
  orderTotal: number;
  customerEmail: string;
  verifiedAmount: number;
  verifiedCurrency?: string;
  verifiedEmail?: string;
}) {
  if (input.verifiedCurrency && input.verifiedCurrency.toUpperCase() !== "KES") {
    return "Currency mismatch";
  }

  if (input.verifiedAmount !== input.orderTotal * 100) {
    return "Amount mismatch";
  }

  if (
    input.verifiedEmail &&
    input.verifiedEmail.toLowerCase() !== input.customerEmail.toLowerCase()
  ) {
    return "Customer mismatch";
  }

  return null;
}

export function isDuplicatePaymentVerification(paymentVerifiedAt: Date | null) {
  return paymentVerifiedAt !== null;
}
