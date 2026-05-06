import { useCallback, useEffect, useRef, type RefObject } from "react";

export type ExamIntegrityFlagKind = "tab_hidden" | "fullscreen_exit" | "fullscreen_denied";

type Options = {
  enabled: boolean;
  sessionActive: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onFlag: (kind: ExamIntegrityFlagKind) => void;
};

const THROTTLE_MS = 2000;

/**
 * Records tab-hidden and fullscreen-exit signals during an active exam session.
 * Fullscreen must be requested separately (user gesture); this hook only listens.
 */
export function useExamIntegritySession({ enabled, sessionActive, containerRef, onFlag }: Options) {
  const lastAt = useRef<Partial<Record<ExamIntegrityFlagKind, number>>>({});
  const wasOurFullscreenRef = useRef(false);

  const throttledFlag = useCallback(
    (kind: ExamIntegrityFlagKind) => {
      const t = Date.now();
      if (t - (lastAt.current[kind] ?? 0) < THROTTLE_MS) return;
      lastAt.current[kind] = t;
      onFlag(kind);
    },
    [onFlag],
  );

  useEffect(() => {
    if (!enabled || !sessionActive) {
      wasOurFullscreenRef.current = false;
      return;
    }

    const el = containerRef.current;
    if (el && document.fullscreenElement === el) {
      wasOurFullscreenRef.current = true;
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        throttledFlag("tab_hidden");
      }
    };

    const onFullscreen = () => {
      const shell = containerRef.current;
      if (!shell) return;
      if (document.fullscreenElement === shell) {
        wasOurFullscreenRef.current = true;
        return;
      }
      if (wasOurFullscreenRef.current) {
        wasOurFullscreenRef.current = false;
        if (!document.fullscreenElement) {
          throttledFlag("fullscreen_exit");
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [enabled, sessionActive, containerRef, throttledFlag]);

  useEffect(() => {
    if (!enabled || !sessionActive) return;
    const shell = containerRef.current;
    return () => {
      if (shell && document.fullscreenElement === shell) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, [enabled, sessionActive, containerRef]);
}
