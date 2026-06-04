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
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom/ui/components/tooltip";
import { cn } from "@sycom/ui/lib/utils";

import { useLearnLessonLockMessage, type LearnLessonLock } from "@/lib/learn-player";

type OkContext = Extract<AppRouterOutputs["learn"]["getPlayerContext"], { status: "ok" }>;
type Section = OkContext["sections"][number];
type Lesson = Section["lessons"][number];

export function LearnSidebar({ courseId, data }: { courseId: string; data: OkContext }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeLessonId = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] !== "learn" || segments[1] !== courseId) return undefined;
    return segments[2];
  }, [pathname, courseId]);

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
}: {
  section: Section;
  courseId: string;
  activeLessonId: string | undefined;
}) {
  const containsActive = section.lessons.some((l) => l.id === activeLessonId);
  return (
    <Collapsible
      className="group/coll mb-1 border-b border-border/60 py-1"
      defaultOpen={containsActive}
    >
      <CollapsibleTrigger className="group flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-muted/80">
        <span className="min-w-0 flex-1 leading-snug">{section.title}</span>
        <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/coll:rotate-180" />
      </CollapsibleTrigger>
      <CollapsiblePanel className="pb-2 pl-1">
        <ul className="space-y-0.5">
          {section.lessons.map((lesson) => (
            <li key={lesson.id}>
              <LessonRow
                courseId={courseId}
                isActive={lesson.id === activeLessonId}
                lesson={lesson}
              />
            </li>
          ))}
        </ul>
      </CollapsiblePanel>
    </Collapsible>
  );
}

function LessonRow({
  lesson,
  courseId,
  isActive,
}: {
  lesson: Lesson;
  courseId: string;
  isActive: boolean;
}) {
  if (lesson.locked && lesson.lock) {
    return <LockedLessonRow isActive={isActive} lesson={lesson} lock={lesson.lock} />;
  }
  const done = lesson.progressStatus === "completed";
  return (
    <Link
      className={cn(
        "flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        isActive ? "bg-muted font-medium" : "hover:bg-muted/60",
      )}
      params={{ courseId, lessonId: lesson.id }}
      preload="intent"
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
  );
}

function LockedLessonRow({
  lesson,
  lock,
  isActive,
}: {
  lesson: Lesson;
  lock: LearnLessonLock;
  isActive: boolean;
}) {
  const message = useLearnLessonLockMessage(lock);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            aria-disabled="true"
            className={cn(
              "flex cursor-not-allowed items-start gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground opacity-80",
              isActive ? "bg-muted/50" : "",
            )}
          >
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
              <LockIcon aria-hidden className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1 leading-snug">{lesson.title}</span>
          </div>
        }
      />
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  );
}
