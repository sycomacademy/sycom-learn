import { useEffect, useState, type RefObject } from "react";

import type { AppRouterOutputs } from "server/trpc/routers/_app";

type OkPlayerLesson = Extract<
  AppRouterOutputs["learn"]["getPlayerContext"],
  { status: "ok" }
>["sections"][number]["lessons"][number];

export type LearnLessonLock = NonNullable<OkPlayerLesson["lock"]>;

const learnLockDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatLearnLessonLockMessage(lock: LearnLessonLock): string {
  switch (lock.kind) {
    case "scheduled_section":
      return `This module opens on ${learnLockDateTimeFormatter.format(lock.opensAt)}.`;
    case "scheduled_lesson":
      return `This lesson opens on ${learnLockDateTimeFormatter.format(lock.opensAt)}.`;
    case "deadline_section":
      return `This module was due by ${learnLockDateTimeFormatter.format(lock.dueAt)}.`;
    case "deadline_lesson":
      return `This lesson was due by ${learnLockDateTimeFormatter.format(lock.dueAt)}.`;
    case "progression":
      return "Finish earlier lessons before continuing.";
  }
}

function lockPlaceholder(lock: LearnLessonLock): string {
  switch (lock.kind) {
    case "scheduled_section":
    case "scheduled_lesson":
      return "Opens at the scheduled time.";
    case "deadline_section":
    case "deadline_lesson":
      return "Past the due date.";
    case "progression":
      return "Finish earlier lessons before continuing.";
  }
}

/**
 * SSR-safe lock message: server renders a generic placeholder, client swaps in the
 * locale/timezone-formatted string after mount to avoid hydration mismatches.
 */
export function useLearnLessonLockMessage(lock: LearnLessonLock): string {
  const [message, setMessage] = useState(() => lockPlaceholder(lock));
  useEffect(() => {
    setMessage(formatLearnLessonLockMessage(lock));
  }, [lock]);
  return message;
}

type LessonRef = { id: string; locked: boolean; lock?: LearnLessonLock };

export function flattenLearnLessons(sections: Array<{ lessons: LessonRef[] }>): LessonRef[] {
  return sections.flatMap((s) => s.lessons);
}

/** Nearest unlocked lesson at or before `attemptedIdx`, else first unlocked in the course. */
export function lastAccessibleLessonId(flat: LessonRef[], attemptedIdx: number): string | null {
  for (let i = Math.min(attemptedIdx, flat.length - 1); i >= 0; i--) {
    if (!flat[i].locked) return flat[i].id;
  }
  return flat.find((l) => !l.locked)?.id ?? null;
}

export function findUnlockedNeighbor(
  flat: LessonRef[],
  idx: number,
  direction: "prev" | "next",
): string | undefined {
  if (idx < 0) return undefined;
  const step = direction === "prev" ? -1 : 1;
  for (let i = idx + step; i >= 0 && i < flat.length; i += step) {
    if (!flat[i].locked) return flat[i].id;
  }
  return undefined;
}

export function findLessonMetaInSections<L extends LessonRef & Record<string, unknown>>(
  sections: Array<{ lessons: L[] }>,
  lessonId: string,
): L | undefined {
  for (const sec of sections) {
    const les = sec.lessons.find((l) => l.id === lessonId);
    if (les) return les;
  }
}

const SCROLL_BOTTOM_THRESHOLD = 48;

/** Tracks whether the referenced scroll container is within `SCROLL_BOTTOM_THRESHOLD`px of its bottom. */
export function useScrolledToBottom(ref: RefObject<HTMLElement | null>): boolean {
  const [atBottom, setAtBottom] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_BOTTOM_THRESHOLD);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
      mo.disconnect();
    };
  }, [ref]);
  return atBottom;
}
