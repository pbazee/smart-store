"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RippleSpinnerProps = {
  size?: number;
  color?: string;
  label?: string;
  className?: string;
  center?: ReactNode;
  showLabel?: boolean;
};

export function RippleSpinner({
  size = 80,
  color = "#FF6400",
  label = "Loading...",
  className,
  center,
  showLabel = false,
}: RippleSpinnerProps) {
  const dotSize = Math.max(8, Math.round(size / 5.5));

  return (
    <div
      className={cn("inline-flex flex-col items-center justify-center gap-4", className)}
      role="status"
      aria-label={label}
      style={
        {
          "--ripple-size": `${size}px`,
          "--ripple-color": color,
          "--ripple-dot-size": `${dotSize}px`,
        } as React.CSSProperties
      }
    >
      <span className="ripple-spinner" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className="ripple-spinner__ring"
            style={{ animationDelay: `${index * 0.18}s` }}
          />
        ))}
        <span className="ripple-spinner__center">
          {center ?? <span className="ripple-spinner__dot" />}
        </span>
      </span>
      {showLabel ? (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

export function AdminLogoRippleSpinner({ label = "Loading admin..." }: { label?: string }) {
  return (
    <RippleSpinner
      size={100}
      color="#FF6400"
      label={label}
      center={
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6400] text-lg font-black text-white shadow-[0_12px_34px_rgba(255,100,0,0.35)]">
          S
        </span>
      }
    />
  );
}

export function PageLoader({
  label = "Loading...",
  admin = false,
}: {
  label?: string;
  admin?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {admin ? <AdminLogoRippleSpinner label={label} /> : <RippleSpinner size={72} label={label} />}
    </div>
  );
}

export function InlineLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[45vh] items-center justify-center py-16">
      <RippleSpinner size={72} label={label} showLabel />
    </div>
  );
}
