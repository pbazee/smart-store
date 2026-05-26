"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      {isLoading ? <Loader2 className={cn("h-4 w-4 animate-spin", spinnerClassName)} /> : null}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
}
