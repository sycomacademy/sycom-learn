import { Link, useRouterState } from "@tanstack/react-router";
import { CheckIcon, ChevronDownIcon, LockIcon } from "lucide-react";
import { useMemo } from "react";

import type { AppRouterOutputs } from "server/trpc/routers/_app";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@sycom/ui/components/collapsible";
import { Progress } from "@sycom/ui/components/progress";
import { cn } from "@sycom/ui/lib/utils";

type OkContext = Extract<AppRouterOutputs["learn"]["getPlayerContext"], { status: "ok" }>;

export function LearnCourseSidebar({ courseId, data }: { courseId: string; data: OkContext }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeLessonId = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] !== "learn" || segments[1] !== courseId) return undefined;
    return segments[2];
  }, [pathname, courseId]);

  const defaultOpenSectionIds = useMemo(() => {
    if (!activeLessonId) return new Set<string>();
    const ids = new Set<string>();
    for (const sec of data.sections) {
      if (sec.lessons.some((l) => l.id === activeLessonId)) {
        ids.add(sec.id);
      }
    }
    return ids;
  }, [data.sections, activeLessonId]);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-r bg-card/40">
      <div className="border-b p-4">
        <h2 className="leading-tight font-semibold">{data.courseTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.completedLessonCount} / {data.totalLessonCount} lessons
        </p>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{data.progressPercent}%</span>
          </div>
          <Progress value={data.progressPercent} />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {data.sections.map((section) => (
          <SectionBlock
            activeLessonId={activeLessonId}
            courseId={courseId}
            defaultOpen={defaultOpenSectionIds.has(section.id)}
            key={section.id}
            section={section}
          />
        ))}
      </nav>
    </aside>
  );
}

function SectionBlock({
  section,
  courseId,
  activeLessonId,
  defaultOpen,
}: {
  section: OkContext["sections"][number];
  courseId: string;
  activeLessonId: string | undefined;
  defaultOpen: boolean;
}) {
  return (
    <Collapsible
      className="group/coll mb-1 border-b border-border/60 py-1"
      defaultOpen={defaultOpen}
    >
      <CollapsibleTrigger className="group flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-muted/80">
        <span className="min-w-0 flex-1 leading-snug">{section.title}</span>
        <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/coll:rotate-180" />
      </CollapsibleTrigger>
      <CollapsiblePanel className="pb-2 pl-1">
        <ul className="space-y-0.5">
          {section.lessons.map((lesson) => {
            const isActive = lesson.id === activeLessonId;
            const done = lesson.progressStatus === "completed";
            const locked = lesson.locked;
            return (
              <li key={lesson.id}>
                {locked ? (
                  <div
                    aria-disabled="true"
                    className={cn(
                      "flex cursor-not-allowed items-start gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground opacity-80",
                      isActive ? "bg-muted/50" : "",
                    )}
                    title={lesson.lockReason}
                  >
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                      <LockIcon aria-hidden className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">{lesson.title}</span>
                  </div>
                ) : (
                  <Link
                    className={cn(
                      "flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      isActive ? "bg-muted font-medium" : "hover:bg-muted/60",
                    )}
                    params={{ courseId, lessonId: lesson.id }}
                    to="/learn/$courseId/$lessonId"
                  >
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                      {done ? (
                        <CheckIcon aria-hidden className="size-3.5 text-emerald-600" />
                      ) : (
                        <span className="size-3.5 rounded-full border border-muted-foreground/30" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">{lesson.title}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </CollapsiblePanel>
    </Collapsible>
  );
}
