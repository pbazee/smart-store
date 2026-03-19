declare module 'canvas-confetti' {
  export interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    zIndex?: number;
    disableForReducedMotion?: boolean;
    scalar?: number;
    startVelocity?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    shapes?: ('square' | 'circle')[];
  }

  export default function confetti(options?: ConfettiOptions): Promise<void>;
}
