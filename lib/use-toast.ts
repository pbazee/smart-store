import { create } from "zustand";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastStore {
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],
  toast: (t) => {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...get().toasts, { ...t, id }] });
    setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
