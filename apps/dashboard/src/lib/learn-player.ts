import { useLayoutEffect, useState } from "react";

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

/** Formats lock reasons using the learner's locale and timezone (opens + deadlines). */
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

function learnLessonLockTzPlaceholder(lock: LearnLessonLock): string {
  switch (lock.kind) {
    case "scheduled_section":
    case "scheduled_lesson":
      return "Opens at the scheduled time.";
    case "deadline_section":
    case "deadline_lesson":
      return "Past the due date.";
    case "progression":
      return "";
  }
}

/**
 * Progression locks format immediately. Opens/deadlines format after mount so the string uses the
 * learner's timezone and SSR HTML stays a stable placeholder (avoids hydration mismatches).
 */
export function useLearnLessonLockDisplayMessage(lock: LearnLessonLock): string {
  const [tzMsg, setTzMsg] = useState("");
  const needsClientTz = lock.kind !== "progression";

  useLayoutEffect(() => {
    if (!needsClientTz) return;
    setTzMsg(formatLearnLessonLockMessage(lock));
  }, [lock, needsClientTz]);

  if (lock.kind === "progression") return formatLearnLessonLockMessage(lock);
  return tzMsg || learnLessonLockTzPlaceholder(lock);
}

export function flattenLearnLessons(
  sections: Array<{ lessons: Array<{ id: string; locked: boolean }> }>,
): Array<{ id: string; locked: boolean }> {
  return sections.flatMap((s) => s.lessons.map((l) => ({ id: l.id, locked: l.locked })));
}

/** Nearest unlocked lesson at or before `attemptedIdx`, else first unlocked in the course. */
export function lastAccessibleLessonId(
  flat: Array<{ id: string; locked: boolean }>,
  attemptedIdx: number,
): string | null {
  for (let i = Math.min(attemptedIdx, flat.length - 1); i >= 0; i--) {
    if (!flat[i].locked) return flat[i].id;
  }
  for (let j = 0; j < flat.length; j++) {
    if (!flat[j].locked) return flat[j].id;
  }
  return null;
}

export function findLessonMetaInSections(
  sections: Array<{ lessons: Array<{ id: string; lock?: LearnLessonLock }> }>,
  lessonId: string,
): { lock?: LearnLessonLock } | undefined {
  for (const sec of sections) {
    const les = sec.lessons.find((l) => l.id === lessonId);
    if (les) return { lock: les.lock };
  }
}
