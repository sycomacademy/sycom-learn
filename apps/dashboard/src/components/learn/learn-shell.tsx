import type { ReactNode } from "react";

import type { AppRouterOutputs } from "server/trpc/routers/_app";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@sycom/ui/components/resizable";

import { LearnHeader } from "./learn-header";
import { LearnSidebar } from "./learn-sidebar";

type OkContext = Extract<AppRouterOutputs["learn"]["getPlayerContext"], { status: "ok" }>;

export function LearnShell({
  courseId,
  data,
  children,
}: {
  courseId: string;
  data: OkContext;
  children: ReactNode;
}) {
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
        <LearnSidebar courseId={courseId} data={data} />
      </ResizablePanel>
      <ResizableHandle className="w-1.5 bg-transparent after:w-2" withHandle />
      <ResizablePanel className="min-w-0" id="learn-main" minSize="35%">
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
          <LearnHeader courseTitle={data.courseTitle} progressPercent={data.progressPercent} />
          {children}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
