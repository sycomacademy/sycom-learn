import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Strong ease-out from emil's animation skill — `[0.23, 1, 0.32, 1]`.
 * The built-in CSS `ease-out` is too weak for UI transitions; this curve
 * starts fast (instant feedback) and decelerates gently.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type FadeInProps = {
  children: ReactNode;
  className?: string;
  /** Re-mount key — fade replays whenever this changes. */
  motionKey?: string | number;
  /** Subtle entry translate in px. Default `0` (pure fade + blur). */
  y?: number;
  /** Animation duration in ms. Default `240`. */
  durationMs?: number;
};

/**
 * One-shot fade-in for mounted content. Honors `prefers-reduced-motion`.
 *
 * Use for: route-level content entering the viewport for the first time
 * (e.g. detail page contents).
 */
export function FadeIn({ children, className, motionKey, y = 0, durationMs = 240 }: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate={shouldReduceMotion ? { opacity: 1 } : { filter: "blur(0px)", opacity: 1, y: 0 }}
        className={className}
        initial={shouldReduceMotion ? false : { filter: "blur(2px)", opacity: 0, y }}
        key={motionKey}
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: durationMs / 1000, ease: EASE_OUT }
        }
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

type CollapseFadeProps = {
  children: ReactNode;
  /** Whether the block should be visible. */
  show: boolean;
  className?: string;
  /** Spacing (px) below the block when expanded. Animates to 0 on exit. */
  marginBottomPx?: number;
  /** Animation duration in ms. Default `220`. */
  durationMs?: number;
};

/**
 * Animates a block in/out of layout: fades + blurs while collapsing its
 * `height` and `marginBottom`. Content below slides smoothly into the
 * vacated space instead of snapping at the end of the exit.
 *
 * Use for: secondary navigation that appears/disappears across sibling
 * routes, banners, or any content that occupies real layout height.
 */
export function CollapseFade({
  children,
  show,
  className,
  marginBottomPx = 24,
  durationMs = 220,
}: CollapseFadeProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false}>
        {show ? (
          <m.div
            animate={{
              filter: "blur(0px)",
              height: "auto",
              marginBottom: marginBottomPx,
              opacity: 1,
            }}
            className={className}
            exit={
              shouldReduceMotion
                ? { height: 0, marginBottom: 0, opacity: 0 }
                : { filter: "blur(2px)", height: 0, marginBottom: 0, opacity: 0 }
            }
            initial={
              shouldReduceMotion
                ? false
                : { filter: "blur(2px)", height: 0, marginBottom: 0, opacity: 0 }
            }
            key="collapse-fade"
            style={{ overflow: "hidden" }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: durationMs / 1000, ease: EASE_OUT }
            }
          >
            {children}
          </m.div>
        ) : null}
      </AnimatePresence>
    </LazyMotion>
  );
}
