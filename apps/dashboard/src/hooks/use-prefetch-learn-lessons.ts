import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { unlockedLearnLessonIds } from "@/lib/learn-player";
import { useTRPC } from "@/lib/trpc/client";

export function usePrefetchLearnLessons(
  courseId: string,
  sections: Array<{ lessons: Array<{ id: string; locked: boolean }> }>,
): void {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const unlockedIds = useMemo(() => unlockedLearnLessonIds(sections), [sections]);
  const unlockedIdsKey = unlockedIds.join(",");

  useEffect(() => {
    for (const lessonId of unlockedIds) {
      void queryClient.prefetchQuery(trpc.learn.getLesson.queryOptions({ courseId, lessonId }));
    }
  }, [courseId, queryClient, trpc, unlockedIdsKey, unlockedIds]);
}
