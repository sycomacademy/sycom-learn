import type { JSONContent } from "@tiptap/core";
import { MailIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { RichTextEditor } from "@sycom/ui/components/tiptap/rich-text-editor";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials } from "@sycom/ui/lib/string";

import type { AppRouterOutputs } from "server/trpc/routers/_app";

type CatalogCourseDetail = AppRouterOutputs["catalog"]["get"];
type Instructor = CatalogCourseDetail["instructors"][number];

const ROLE_LABELS: Record<Instructor["role"], string> = {
  main: "Lead instructor",
  secondary: "Co-instructor",
};

export type CatalogCourseSummaryProps = {
  summary: CatalogCourseDetail["summary"];
};

export function CatalogCourseSummary({ summary }: CatalogCourseSummaryProps) {
  if (!summary) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Summary</h2>
      <RichTextEditor
        content={summary as JSONContent | null}
        editable={false}
        mode="lightweight"
        showAdvancedChrome={false}
      />
    </section>
  );
}

export type CatalogCourseInstructorsProps = {
  instructors: CatalogCourseDetail["instructors"];
};

export function CatalogCourseInstructors({ instructors }: CatalogCourseInstructorsProps) {
  if (!instructors || instructors.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Instructors</h2>
        <span className="text-xs text-muted-foreground">
          {instructors.length} {instructors.length === 1 ? "person" : "people"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {instructors.map((instructor) => (
          <InstructorCard instructor={instructor} key={instructor.userId} />
        ))}
      </div>
    </section>
  );
}

function InstructorCard({ instructor }: { instructor: Instructor }) {
  const isMain = instructor.role === "main";

  return (
    <div className="group flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start gap-3">
        <Avatar className="size-11 rounded-md">
          {instructor.image ? (
            <AvatarImage alt={instructor.name} src={buildImageUrl(instructor.image)} />
          ) : null}
          <AvatarFallback className="rounded-md text-xs font-medium text-muted-foreground">
            {getInitials(instructor.name).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm leading-none font-medium">{instructor.name}</p>
          </div>
          <Badge size="sm" variant={isMain ? "default" : "outline"}>
            {ROLE_LABELS[instructor.role]}
          </Badge>
        </div>
      </div>

      <a
        aria-label={`Email ${instructor.name}`}
        className="-mx-1 flex items-center gap-2 truncate rounded-md px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        href={`mailto:${instructor.email}`}
      >
        <MailIcon className="size-3.5 shrink-0 opacity-70" />
        <span className="truncate">{instructor.email}</span>
      </a>
    </div>
  );
}
