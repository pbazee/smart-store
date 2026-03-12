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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={sessionUser ? "Open account menu" : "Open account options"}
          className="rounded-full border border-border/70 p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <User2 className="h-5 w-5" />
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
