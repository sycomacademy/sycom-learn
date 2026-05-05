import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { EASE_OUT } from "@/components/layout/motion-fade";

type FadeSwapProps = {
  /** Step index or key — drives enter/exit when it changes. */
  stepKey: string | number;
  children: ReactNode;
  className?: string;
  /** Animation duration in ms. Default `240`. */
  durationMs?: number;
};

/**
 * Cross-fades stepped content (`AnimatePresence` + blur/opacity/y), matching `FadeIn` easing.
 */
export function OnboardingFadeSwap({
  stepKey,
  children,
  className,
  durationMs = 240,
}: FadeSwapProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false} mode="wait">
        <m.div
          key={stepKey}
          animate={shouldReduceMotion ? { opacity: 1 } : { filter: "blur(0px)", opacity: 1, y: 0 }}
          className={className}
          exit={shouldReduceMotion ? { opacity: 0 } : { filter: "blur(2px)", opacity: 0, y: -6 }}
          initial={shouldReduceMotion ? false : { filter: "blur(2px)", opacity: 0, y: 8 }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: durationMs / 1000, ease: EASE_OUT }
          }
        >
          {children}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}
