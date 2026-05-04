import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type AutoSaveHookStatus = "idle" | "dirty" | "saving" | "saved" | "error";

type UseAutoSaveOptions<T> = {
  /**
   * When set (e.g. `lessonId`), changing this resets the baseline + saved badge to idle.
   * Omit for collapsible editors that only toggle `enabled`.
   */
  baselineResetKey?: string;
  data: T;
  delay?: number;
  enabled?: boolean;
  onSave: (opts: { silent: boolean }) => Promise<void>;
};

function serializeData(value: unknown) {
  return JSON.stringify(value);
}

export function useAutoSave<T>({
  baselineResetKey,
  data,
  delay = 20_000,
  enabled = true,
  onSave,
}: UseAutoSaveOptions<T>): {
  lastSavedAt: Date | null;
  save: () => Promise<void>;
  status: AutoSaveHookStatus;
} {
  const dataRef = useRef(data);
  dataRef.current = data;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const lastSavedSerializedRef = useRef(serializeData(data as unknown));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerScheduledRef = useRef(false);
  const saveTailRef = useRef<Promise<void>>(Promise.resolve());
  const hasSuccessfulSaveRef = useRef(false);

  const [status, setStatus] = useState<AutoSaveHookStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  /** Stable second slot so exhaustive-deps stays a literal `[enabled, string]`. */
  const baselineGate = baselineResetKey === undefined ? "__inline_editor__" : baselineResetKey;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    timerScheduledRef.current = false;
  };

  /** Baseline snapshot before paint; runs when expanding a row or switching lessons (full-screen editor). */
  useLayoutEffect(() => {
    if (!enabled) return undefined;

    lastSavedSerializedRef.current = serializeData(dataRef.current as unknown);

    clearTimer();

    if (baselineResetKey !== undefined) {
      hasSuccessfulSaveRef.current = false;
      setLastSavedAt(null);
      setStatus("idle");
    }

    return undefined;
  }, [baselineGate, baselineResetKey, enabled]);

  useEffect(() => () => clearTimer(), []);

  const flushSaveOnce = useCallback(async (silent: boolean) => {
    clearTimer();

    try {
      setStatus("saving");
      await onSaveRef.current({ silent });
      lastSavedSerializedRef.current = serializeData(dataRef.current as unknown);
      hasSuccessfulSaveRef.current = true;
      setLastSavedAt(new Date());
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, []);

  const enqueueSaveRef = useRef<(silent: boolean) => Promise<void>>(() => Promise.resolve());

  enqueueSaveRef.current = async (silent: boolean) => {
    const chained = saveTailRef.current.catch(() => {}).then(() => flushSaveOnce(silent));
    saveTailRef.current = chained;
    await chained;
  };

  const save = useCallback(async () => {
    await enqueueSaveRef.current(false);
  }, []);

  const serialized = serializeData(data as unknown);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return undefined;
    }

    const baseline = lastSavedSerializedRef.current;
    const dirty = serialized !== baseline;

    if (!dirty) {
      clearTimer();
      setStatus((prev) => {
        if (prev === "saving") return prev;
        if (prev === "error") return prev;
        return hasSuccessfulSaveRef.current ? "saved" : "idle";
      });
      return undefined;
    }

    setStatus((prev) => {
      if (prev === "saving") return prev;
      if (prev === "error") return "dirty";
      return "dirty";
    });

    if (!timerScheduledRef.current) {
      timerScheduledRef.current = true;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        timerScheduledRef.current = false;
        void enqueueSaveRef.current(true);
      }, delay);
    }

    return undefined;
  }, [delay, enabled, serialized]);

  return { lastSavedAt, save, status };
}
