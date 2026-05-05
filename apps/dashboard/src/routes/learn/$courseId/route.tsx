import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { LearnAccessPanel } from "@/components/learn/learn-access-panel";
import { LearnCourseSidebar } from "@/components/learn/learn-course-sidebar";
import { useTRPC } from "@/lib/trpc/client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@sycom/ui/components/resizable";

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
    <ResizablePanelGroup
      className="min-h-0 w-full flex-1"
      id={`learn-course-${courseId}`}
      orientation="horizontal"
    >
      <ResizablePanel
        className="min-w-0"
        collapsedSize="0%"
        collapsible
        defaultSize="25%"
        id="learn-sidebar"
        maxSize="50%"
        minSize="18%"
      >
        <LearnCourseSidebar courseId={courseId} data={data} />
      </ResizablePanel>
      <ResizableHandle className="w-1.5 bg-transparent after:w-2" withHandle />
      <ResizablePanel className="min-w-0" id="learn-main" minSize="35%">
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
          <Outlet />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
