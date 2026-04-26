"use client";

interface RippleLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  label?: string;
}

export function RippleLoader({
  size = "md",
  color = "#F97316",
  label = "Loading...",
}: RippleLoaderProps) {
  const sizes = { sm: 40, md: 80, lg: 120 };
  const px = sizes[size];

  return (
    <div
      className="flex flex-col items-center justify-center gap-4"
      role="status"
      aria-label={label}
    >
      <div className="relative" style={{ width: px, height: px }}>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="absolute inset-0 rounded-full border-2 opacity-0"
            style={{
              borderColor: color,
              animation: "ripple 1.8s cubic-bezier(0, 0.2, 0.8, 1) infinite",
              animationDelay: `${index * 0.6}s`,
            }}
          />
        ))}
        <span
          className="absolute inset-0 m-auto block rounded-full"
          style={{
            width: px * 0.25,
            height: px * 0.25,
            backgroundColor: color,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
      <span className="animate-pulse text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <RippleLoader size="lg" label="Loading..." />
    </div>
  );
}

export function InlineLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <RippleLoader size="md" label={label} />
    </div>
  );
}
