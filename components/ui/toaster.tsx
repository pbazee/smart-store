"use client";
import { useToast } from "@/lib/use-toast";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg shadow-lg border",
              "bg-background border-border",
              toast.variant === "destructive" && "border-destructive bg-destructive/10"
            )}
          >
            <div className="flex-1">
              {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
              {toast.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{toast.description}</p>
              )}
            </div>
            <button onClick={() => dismiss(toast.id)}>
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
