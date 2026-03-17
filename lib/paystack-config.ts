function normalizeEnvValue(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function isLiveDeployment() {
  return process.env.VERCEL_ENV === "production";
}

export function getPaystackSecretKey() {
  const explicitLiveKey =
    normalizeEnvValue(process.env.PAYSTACK_LIVE_SECRET_KEY) ??
    normalizeEnvValue(process.env.PAYSTACK_SECRET_KEY_LIVE);
  const defaultKey = normalizeEnvValue(process.env.PAYSTACK_SECRET_KEY);
  const testKey = normalizeEnvValue(process.env.PAYSTACK_TEST_SECRET_KEY);

  const preferredKey = isLiveDeployment()
    ? explicitLiveKey ?? defaultKey ?? testKey
    : defaultKey ?? explicitLiveKey ?? testKey;

  if (!preferredKey) {
    throw new Error("Paystack secret key is missing");
  }

  if (isLiveDeployment() && preferredKey.startsWith("sk_test_")) {
    throw new Error("Paystack live secret key is not configured for production checkout");
  }

  return preferredKey;
}
