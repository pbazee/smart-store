import { createHmac, timingSafeEqual } from "node:crypto";

const PASSWORD_RESET_TTL_SECONDS = 60 * 60;
const PASSWORDLESS_RESET_MARKER = "__ske_no_password__";

export type PasswordResetTokenPayload = {
  userId: string;
  email: string;
  exp: number;
};

type PasswordResetTokenSubject = {
  userId: string;
  email: string;
  passwordHash?: string | null;
};

type ParsedPasswordResetToken = {
  encodedPayload: string;
  signature: string;
  payload: PasswordResetTokenPayload;
};

export type PasswordResetTokenVerification =
  | {
      valid: true;
      payload: PasswordResetTokenPayload;
    }
  | {
      valid: false;
      reason: "invalid" | "expired";
    };

function getPasswordResetSecret() {
  const secret = process.env.PASSWORD_RESET_SECRET || process.env.AUTH_SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "development-password-reset-secret-change-me";
  }

  throw new Error("PASSWORD_RESET_SECRET or AUTH_SESSION_SECRET is required in production");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getPasswordResetSeed(passwordHash?: string | null) {
  return passwordHash || PASSWORDLESS_RESET_MARKER;
}

function signPasswordResetPayload(encodedPayload: string, passwordHash?: string | null) {
  return createHmac("sha256", getPasswordResetSecret())
    .update(`${encodedPayload}.${getPasswordResetSeed(passwordHash)}`)
    .digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createPasswordResetToken(
  subject: PasswordResetTokenSubject,
  options?: { expiresInSeconds?: number }
) {
  const payload: PasswordResetTokenPayload = {
    userId: subject.userId,
    email: normalizeEmail(subject.email),
    exp: Math.floor(Date.now() / 1000) + (options?.expiresInSeconds ?? PASSWORD_RESET_TTL_SECONDS),
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPasswordResetPayload(encodedPayload, subject.passwordHash);

  return `${encodedPayload}.${signature}`;
}

export function parsePasswordResetToken(token?: string | null): ParsedPasswordResetToken | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(
      decodeBase64Url(encodedPayload)
    ) as Partial<PasswordResetTokenPayload>;

    if (
      typeof parsedPayload.userId !== "string" ||
      !parsedPayload.userId.trim() ||
      typeof parsedPayload.email !== "string" ||
      !parsedPayload.email.trim() ||
      typeof parsedPayload.exp !== "number" ||
      !Number.isFinite(parsedPayload.exp)
    ) {
      return null;
    }

    return {
      encodedPayload,
      signature,
      payload: {
        userId: parsedPayload.userId.trim(),
        email: normalizeEmail(parsedPayload.email),
        exp: Math.trunc(parsedPayload.exp),
      },
    };
  } catch {
    return null;
  }
}

export function verifyPasswordResetToken(
  token: string,
  subject: PasswordResetTokenSubject
): PasswordResetTokenVerification {
  const parsed = parsePasswordResetToken(token);
  if (!parsed) {
    return { valid: false, reason: "invalid" };
  }

  if (
    parsed.payload.userId !== subject.userId ||
    parsed.payload.email !== normalizeEmail(subject.email)
  ) {
    return { valid: false, reason: "invalid" };
  }

  if (parsed.payload.exp <= Math.floor(Date.now() / 1000)) {
    return { valid: false, reason: "expired" };
  }

  const expectedSignature = signPasswordResetPayload(
    parsed.encodedPayload,
    subject.passwordHash
  );

  if (!safeCompare(parsed.signature, expectedSignature)) {
    return { valid: false, reason: "invalid" };
  }

  return {
    valid: true,
    payload: parsed.payload,
  };
}

export function getPasswordResetTokenTtlSeconds() {
  return PASSWORD_RESET_TTL_SECONDS;
}
