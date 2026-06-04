import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { LearnAccessPanel } from "@/components/learn/learn-access-panel";
import { LearnShell } from "@/components/learn/learn-shell";
import { usePrefetchLearnLessons } from "@/hooks/use-prefetch-learn-lessons";
import { useTRPC } from "@/lib/trpc/client";

type OkPlayerContext = Extract<AppRouterOutputs["learn"]["getPlayerContext"], { status: "ok" }>;

export const Route = createFileRoute("/learn/$courseId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.learn.getPlayerContext.queryOptions({ courseId: params.courseId }),
    );
  },
  component: LearnCourseLayout,
});

function LearnCourseLayout() {
  const { courseId } = Route.useParams();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.learn.getPlayerContext.queryOptions({ courseId }));

  if (data.status !== "ok") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <LearnAccessPanel courseId={courseId} variant={data} />
      </div>
    );
  }

  return <LearnCoursePlayer courseId={courseId} data={data} />;
}

function LearnCoursePlayer({ courseId, data }: { courseId: string; data: OkPlayerContext }) {
  usePrefetchLearnLessons(courseId, data.sections);

  return (
    <LearnShell courseId={courseId} data={data}>
      <Outlet />
    </LearnShell>
  );
}
