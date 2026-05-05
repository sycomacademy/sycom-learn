import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { toastManager } from "@sycom/ui/components/toast";

import { findLessonMetaInSections, formatLearnLessonLockMessage } from "@/lib/learn-player";
import { useTRPC } from "@/lib/trpc/client";

const learnCourseIndexSearchSchema = z.object({
  lockedLesson: z.string().optional(),
});

export const Route = createFileRoute("/learn/$courseId/")({
  validateSearch: (search) => learnCourseIndexSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ lockedLesson: search.lockedLesson }),
  loader: async ({ context, params, deps }) => {
    const data = await context.queryClient.ensureQueryData(
      context.trpc.learn.getPlayerContext.queryOptions({ courseId: params.courseId }),
    );
    if (data.status === "ok" && data.nextLessonId) {
      throw redirect({
        to: "/learn/$courseId/$lessonId",
        params: { courseId: params.courseId, lessonId: data.nextLessonId },
        search: deps.lockedLesson ? { lockedLesson: deps.lockedLesson } : {},
      });
    }
  },
  component: LearnCourseIndexFallback,
});

function LearnCourseIndexFallback() {
  const { courseId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const { data: player } = useSuspenseQuery(trpc.learn.getPlayerContext.queryOptions({ courseId }));

  useEffect(() => {
    const blockedId = search.lockedLesson;
    if (!blockedId || player.status !== "ok") return;
    const meta = findLessonMetaInSections(player.sections, blockedId);
    toastManager.add({
      title: "Lesson locked",
      description: meta?.lock
        ? `Lesson ${blockedId}: ${formatLearnLessonLockMessage(meta.lock)}`
        : `You can't open lesson ${blockedId} yet.`,
      type: "warning",
    });
    void navigate({ search: { lockedLesson: undefined }, replace: true });
  }, [search.lockedLesson, player, navigate]);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto p-8 text-center">
      <p className="text-muted-foreground">This course does not have any lessons yet.</p>
      <p className="font-mono text-xs text-muted-foreground">{courseId}</p>
    </div>
  );
}
