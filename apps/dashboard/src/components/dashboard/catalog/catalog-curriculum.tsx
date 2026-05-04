import type { AppRouterOutputs } from "server/trpc/routers/_app";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@sycom/ui/components/collapsible";
import { cn } from "@sycom/ui/lib/utils";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  ListChecksIcon,
  ScrollTextIcon,
} from "lucide-react";
import { useState } from "react";

import { formatMinutes } from "./catalog-schema";

type Section = AppRouterOutputs["catalog"]["get"]["sections"][number];

function lessonTypeIcon(type: Section["lessons"][number]["type"]) {
  switch (type) {
    case "quiz":
      return ListChecksIcon;
    case "exam":
      return ScrollTextIcon;
    default:
      return FileTextIcon;
  }
}

export type CatalogCurriculumProps = {
  sections: Section[];
};

export function CatalogCurriculum({ sections }: CatalogCurriculumProps) {
  const totalLessons = sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <div className="rounded-lg border bg-card shadow-xs/5">
      <div className="border-b px-4 py-4">
        <h2 className="text-lg font-semibold">Course curriculum</h2>
        <p className="text-sm text-muted-foreground">
          {sections.length} section{sections.length === 1 ? "" : "s"} · {totalLessons} lesson
          {totalLessons === 1 ? "" : "s"}
        </p>
      </div>
      <ul className="divide-y">
        {sections.map((section, index) => (
          <CatalogCurriculumSection index={index} key={section.id} section={section} />
        ))}
      </ul>
    </div>
  );
}

function CatalogCurriculumSection({ index, section }: { index: number; section: Section }) {
  const [open, setOpen] = useState(index === 0);
  const lessonCount = section.lessons.length;

  return (
    <li>
      <Collapsible onOpenChange={setOpen} open={open}>
        <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium tabular-nums">
            {index + 1}
          </span>
          {open ? (
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="leading-snug font-medium">{section.title}</p>
            <p className="text-xs text-muted-foreground">
              {lessonCount} lesson{lessonCount === 1 ? "" : "s"} ·{" "}
              {formatMinutes(section.totalMinutes)}
            </p>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="space-y-1 border-t bg-muted/20 px-4 py-2 pb-4">
            {section.lessons.map((lesson) => {
              const Icon = lessonTypeIcon(lesson.type);
              return (
                <li
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm"
                  key={lesson.id}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 leading-snug">{lesson.title}</span>
                  <span className={cn("shrink-0 text-muted-foreground tabular-nums")}>
                    {formatMinutes(lesson.minutes)}
                  </span>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
