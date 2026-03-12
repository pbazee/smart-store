"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser, UserRole } from "@/types";
import {
  DEMO_AUTH_COOKIE,
  normalizeUserRole,
  serializeDemoAuthCookie,
} from "@/lib/user-role";

type DemoAuthState = {
  user: SessionUser | null;
  signInAs: (role: Exclude<UserRole, "guest">) => void;
  signOut: () => void;
};

function setDemoCookie(user: SessionUser | null) {
  if (typeof document === "undefined") {
    return;
  }

  if (!user?.isDemo) {
    document.cookie = `${DEMO_AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  document.cookie = `${DEMO_AUTH_COOKIE}=${serializeDemoAuthCookie({
    role: user.role as Exclude<UserRole, "guest">,
    label: user.fullName || user.firstName || "Demo User",
  })}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

function buildDemoUser(role: Exclude<UserRole, "guest">): SessionUser {
  const isAdmin = role === "admin";

  return {
    id: `demo-${role}`,
    firstName: "Demo",
    lastName: isAdmin ? "Admin" : "Customer",
    fullName: isAdmin ? "Demo Admin" : "Demo Customer",
    email: isAdmin ? "admin@demo.smartest.ke" : "customer@demo.smartest.ke",
    role: normalizeUserRole(role),
    isDemo: true,
  };
}

export const useDemoAuthStore = create<DemoAuthState>()(
  persist(
    (set) => ({
      user: null,
      signInAs: (role) =>
        set(() => {
          const user = buildDemoUser(role);
          setDemoCookie(user);
          return { user };
        }),
      signOut: () =>
        set(() => {
          setDemoCookie(null);
          return { user: null };
        }),
    }),
    {
      name: "smartest-store-demo-auth",
      onRehydrateStorage: () => (state) => {
        setDemoCookie(state?.user ?? null);
      },
    }
  )
);
