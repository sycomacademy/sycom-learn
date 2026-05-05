import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { LearnAccessPanel } from "@/components/learn/learn-access-panel";
import { LearnShell } from "@/components/learn/learn-shell";
import { useTRPC } from "@/lib/trpc/client";

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

  return (
    <LearnShell courseId={courseId} data={data}>
      <Outlet />
    </LearnShell>
  );
}
