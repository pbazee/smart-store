"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Package2,
  User2,
  UserPlus,
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

export function AccountMenu() {
  const router = useRouter();
  const { sessionUser, signOut } = useSessionUser();

  const displayName =
    sessionUser?.fullName ||
    `${sessionUser?.firstName ?? ""} ${sessionUser?.lastName ?? ""}`.trim() ||
    "Smart Shopper";
  const triggerLabel = sessionUser?.firstName || displayName.split(" ")[0] || "Account";
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
          aria-label={sessionUser ? "Open account menu" : "Open account options"}
          className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2 py-1.5 text-muted-foreground transition-all hover:border-orange-200 hover:bg-muted hover:text-foreground"
        >
          {sessionUser ? (
            <>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.24)]">
                {initials}
              </span>
              <span className="hidden max-w-24 truncate text-sm font-semibold text-foreground lg:inline">
                {triggerLabel}
              </span>
            </>
          ) : (
            <>
              <User2 className="h-5 w-5 lg:hidden" />
              <span className="hidden text-sm font-semibold text-foreground lg:inline">
                Sign In
              </span>
              <LogIn className="hidden h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground lg:block" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          <div className="space-y-1 normal-case tracking-normal">
            <p className="text-sm font-semibold text-foreground">
              {sessionUser ? displayName : "Account"}
            </p>
            <p className="text-xs text-muted-foreground">
              {sessionUser
                ? sessionUser.isDemo
                  ? "Demo session"
                  : sessionUser.email
                : "Sign in to access your profile, orders, and wishlist."}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sessionUser ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/account">
                <User2 className="h-4 w-4" />
                My Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/orders">
                <Package2 className="h-4 w-4" />
                My Orders
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
              onSelect={(event) => {
                event.preventDefault();
                void signOut().then(() => {
                  router.push("/");
                  router.refresh();
                });
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/sign-in">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </DropdownMenuItem>
        )}
        {!sessionUser && (
          <DropdownMenuItem asChild>
            <Link href="/sign-up">
              <UserPlus className="h-4 w-4" />
              Join
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
