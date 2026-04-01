import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parsePasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/password-reset-token";

type PasswordResetUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  passwordHash: string | null;
};

export type PasswordResetLinkValidation =
  | {
      ok: true;
      user: PasswordResetUser;
      expiresAt: Date;
    }
  | {
      ok: false;
      error: string;
    };

export async function validatePasswordResetLink(
  token?: string | null
): Promise<PasswordResetLinkValidation> {
  const parsedToken = parsePasswordResetToken(token);

  if (!parsedToken) {
    return {
      ok: false,
      error: "This password reset link is invalid. Request a new one and try again.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: parsedToken.payload.userId,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user?.email) {
    return {
      ok: false,
      error: "This password reset link is invalid. Request a new one and try again.",
    };
  }

  const verification = verifyPasswordResetToken(token ?? "", {
    userId: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
  });

  if (!verification.valid) {
    return {
      ok: false,
      error:
        verification.reason === "expired"
          ? "This password reset link has expired. Request a new one and try again."
          : "This password reset link is invalid or has already been used.",
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      passwordHash: user.passwordHash,
    },
    expiresAt: new Date(verification.payload.exp * 1000),
  };
}
