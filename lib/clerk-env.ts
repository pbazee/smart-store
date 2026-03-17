function normalizeEnvValue(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function getClerkPublishableKey() {
  return (
    normalizeEnvValue(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) ??
    normalizeEnvValue(process.env.CLERK_PUBLISHABLE_KEY)
  );
}
