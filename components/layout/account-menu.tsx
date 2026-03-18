"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package2,
  User2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessionUser } from "@/hooks/use-session-user";
import type { SessionUser } from "@/types";

function SignedInAccountMenu({
  sessionUser,
  isSigningOut,
  onSignOut,
}: {
  sessionUser: SessionUser;
  isSigningOut: boolean;
  onSignOut: () => void;
}) {
  const displayName =
    sessionUser.fullName ||
    `${sessionUser.firstName ?? ""} ${sessionUser.lastName ?? ""}`.trim() ||
    "Smart Shopper";
  const triggerLabel = sessionUser.firstName || displayName.split(" ")[0] || "Account";
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "SS";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2 py-1.5 text-muted-foreground transition-all hover:border-orange-200 hover:bg-muted hover:text-foreground"
        >
          {sessionUser.imageUrl ? (
            <span className="flex h-8 w-8 overflow-hidden rounded-full ring-2 ring-orange-500/15">
              <img
                src={sessionUser.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.24)]">
              {initials}
            </span>
          )}
          <span className="hidden max-w-24 truncate text-sm font-semibold text-foreground lg:inline">
            {triggerLabel}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          <div className="space-y-1 normal-case tracking-normal">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {sessionUser.isDemo ? "Demo session" : sessionUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <User2 className="h-4 w-4" />
            My Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/orders">
            <Package2 className="h-4 w-4" />
            Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/wishlist">
            <Heart className="h-4 w-4" />
            Wishlist
          </Link>
        </DropdownMenuItem>
        {sessionUser.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <LayoutDashboard className="h-4 w-4" />
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            onSignOut();
          }}
        >
          {isSigningOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          {isSigningOut ? "Signing out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SignedOutAccountButton({ isLoading = false }: { isLoading?: boolean }) {
  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        aria-label="Signing out"
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white opacity-80 shadow-[0_16px_40px_rgba(249,115,22,0.28)]"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Signing out...</span>
        <span className="sm:hidden">...</span>
      </button>
    );
  }

  return (
    <Link
      href="/sign-in"
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(249,115,22,0.28)] transition-all hover:scale-[1.02] hover:bg-orange-600 active:scale-[0.98]"
    >
      <span className="hidden sm:inline">Sign In / Join</span>
      <span className="sm:hidden">Sign In</span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function AccountMenuSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2"
    >
      <span className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      <span className="hidden h-4 w-20 animate-pulse rounded-full bg-muted sm:block" />
    </div>
  );
}

export function AccountMenu() {
  const router = useRouter();
  const { isLoaded, sessionUser, signOut } = useSessionUser();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const previousResolvedUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const resolvedUserId = sessionUser?.id ?? null;

    if (previousResolvedUserId.current === undefined) {
      previousResolvedUserId.current = resolvedUserId;
      return;
    }

    if (previousResolvedUserId.current !== resolvedUserId) {
      previousResolvedUserId.current = resolvedUserId;
      router.refresh();
      return;
    }

    previousResolvedUserId.current = resolvedUserId;
  }, [sessionUser?.id, isLoaded, router]);

  const handleSignOut = async () => {
    if (!sessionUser || isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      router.push("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isSigningOut) {
    return <SignedOutAccountButton isLoading />;
  }

  if (sessionUser) {
    return (
      <SignedInAccountMenu
        sessionUser={sessionUser}
        isSigningOut={isSigningOut}
        onSignOut={() => {
          void handleSignOut();
        }}
      />
    );
  }

  if (!isLoaded) {
    return <AccountMenuSkeleton />;
  }

  return <SignedOutAccountButton />;
}
