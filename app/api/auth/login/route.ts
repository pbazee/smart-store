import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isProtectedAdminEmail } from "@/lib/admin-identity";
import { createLocalAuthToken, getLocalAuthCookieMaxAge, LOCAL_AUTH_COOKIE } from "@/lib/local-auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { normalizeUserRole } from "@/lib/user-role";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);
    let user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (
      !user ||
      (!isProtectedAdminEmail(user.email ?? email) && normalizeUserRole(user.role) !== "admin") ||
      !user.passwordHash
    ) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    if (isProtectedAdminEmail(user.email) && normalizeUserRole(user.role) !== "admin") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
    }

    const token = await createLocalAuthToken({
      userId: user.id,
      email: user.email ?? email.toLowerCase(),
      name: user.fullName ?? "Store Admin",
      role: "admin",
    });
    const response = NextResponse.json({
      success: true,
      data: {
        role: "admin",
      },
    });

    response.cookies.set(LOCAL_AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: getLocalAuthCookieMaxAge(),
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid login payload" }, { status: 400 });
    }

    console.error("Admin login failed:", error);
    return NextResponse.json({ error: "Admin login failed" }, { status: 500 });
  }
}
