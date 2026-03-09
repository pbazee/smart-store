import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DemoStore {
  useMockData: boolean;
  toggleMockData: () => void;
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      useMockData: true,
      toggleMockData: () => set({ useMockData: !get().useMockData }),
    }),
    { name: "smartest-store-demo" }
  )
);
