"use client";

import { cn } from "@/lib/utils";

type RippleSpinnerProps = {
  size?: number;
  color?: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
};

export function RippleSpinner({
  size = 48,
  color = "#FF6400",
  label = "Loading...",
  className,
  showLabel = false,
}: RippleSpinnerProps) {
  return (
    <div
      className={cn("inline-flex flex-col items-center justify-center gap-4", className)}
      role="status"
      aria-label={label}
      style={
        {
          "--ripple-size": `${size}px`,
          "--ripple-color": color,
        } as React.CSSProperties
      }
    >
      <span className="ripple-spinner" aria-hidden="true" />
      {showLabel ? (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

export function AdminLogoRippleSpinner({ label = "Loading admin..." }: { label?: string }) {
  return <RippleSpinner size={64} color="#FF6400" label={label} />;
}

export function PageLoader({
  label = "Loading...",
  admin = false,
}: {
  label?: string;
  admin?: boolean;
}) {
  return (
    <div className="flex min-h-[65vh] w-full items-center justify-center py-20">
      {admin ? <AdminLogoRippleSpinner label={label} /> : <RippleSpinner size={64} label={label} />}
    </div>
  );
}

export function InlineLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[45vh] items-center justify-center py-16">
      <RippleSpinner size={48} label={label} showLabel />
    </div>
  );
}
