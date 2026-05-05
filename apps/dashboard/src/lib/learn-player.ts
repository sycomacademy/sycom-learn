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
  sections: Array<{ lessons: Array<{ id: string; lockReason?: string }> }>,
  lessonId: string,
): { lockReason?: string } | undefined {
  for (const sec of sections) {
    const les = sec.lessons.find((l) => l.id === lessonId);
    if (les) return { lockReason: les.lockReason };
  }
}
