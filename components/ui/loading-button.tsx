"use client";

import { Button } from "@/components/ui/button";
import { RippleSpinner } from "@/components/ui/ripple-loader";
import { cn } from "@/lib/utils";

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  isLoading?: boolean;
  loadingText?: string;
  spinnerClassName?: string;
};

export function LoadingButton({
  isLoading = false,
  loadingText,
  children,
  disabled,
  spinnerClassName,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading}
      className={className}
      {...props}
    >
      {isLoading ? (
        <RippleSpinner
          size={28}
          color="currentColor"
          label={loadingText || "Loading"}
          className={cn("shrink-0 text-white", spinnerClassName)}
        />
      ) : null}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
}
