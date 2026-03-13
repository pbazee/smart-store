"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createLocalAuthToken,
  getLocalAuthCookieMaxAge,
  LOCAL_AUTH_COOKIE,
} from "@/lib/local-auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { resolveAdminRedirectPath } from "@/lib/auth-routing";
import { normalizeUserRole } from "@/lib/user-role";

const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  redirectUrl: z.string().optional(),
});

export type AdminLoginActionState = {
  error: string | null;
};

export async function submitAdminLoginAction(
  _previousState: AdminLoginActionState,
  formData: FormData
): Promise<AdminLoginActionState> {
  try {
    const payload = adminLoginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      redirectUrl: formData.get("redirectUrl"),
    });

    const user = await prisma.user.findUnique({
      where: {
        email: payload.email.toLowerCase(),
      },
    });

    if (!user || normalizeUserRole(user.role) !== "admin" || !user.passwordHash) {
      return { error: "Invalid credentials" };
    }

    const passwordMatches = await verifyPassword(payload.password, user.passwordHash);
    if (!passwordMatches) {
      return { error: "Invalid credentials" };
    }

    const token = await createLocalAuthToken({
      userId: user.id,
      email: user.email ?? payload.email.toLowerCase(),
      name: user.fullName ?? "Store Admin",
      role: "admin",
    });

    const cookieStore = await cookies();
    cookieStore.set(LOCAL_AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getLocalAuthCookieMaxAge(),
    });

    redirect(resolveAdminRedirectPath(payload.redirectUrl));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid credentials" };
    }

    console.error("Admin login failed:", error);
    return { error: "Invalid credentials" };
  }
}
