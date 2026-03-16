import { cookies } from "next/headers";

export const LOCAL_AUTH_COOKIE = "ske_local_auth";
const LOCAL_AUTH_TTL_SECONDS = 60 * 60 * 12;

export type LocalAuthSession = {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "customer";
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "development-local-auth-secret-change-me";
  }

  throw new Error("AUTH_SESSION_SECRET is required in production");
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  return atob(`${normalized}${padding}`);
}

async function signValue(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));

  return encodeBase64Url(String.fromCharCode(...new Uint8Array(signature)));
}

export async function createLocalAuthToken(input: Omit<LocalAuthSession, "exp">) {
  const session: LocalAuthSession = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + LOCAL_AUTH_TTL_SECONDS,
  };
  const payload = encodeBase64Url(JSON.stringify(session));
  const signature = await signValue(payload);

  return `${payload}.${signature}`;
}

export async function verifyLocalAuthToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await signValue(payload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as LocalAuthSession;
    if (!parsed?.userId || !parsed?.email || !parsed?.name || !parsed.role) {
      return null;
    }

    if (!["admin", "customer"].includes(parsed.role)) {
      return null;
    }

    if (parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function getLocalAuthSession() {
  const cookieStore = await cookies();

  return verifyLocalAuthToken(cookieStore.get(LOCAL_AUTH_COOKIE)?.value);
}

export function getLocalAuthCookieMaxAge() {
  return LOCAL_AUTH_TTL_SECONDS;
}
