import type { JSONContent } from "@tiptap/core";
import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { RichTextEditor } from "@sycom/ui/components/tiptap/rich-text-editor";
import { Image } from "@sycom/ui/image";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials } from "@sycom/ui/lib/string";
import { BookOpenIcon } from "lucide-react";

import { COURSE_DIFFICULTY_LABELS, formatMinutes } from "./catalog-schema";

type CatalogCourseDetail = AppRouterOutputs["catalog"]["get"];

function courseSummaryToEditorContent(summary: unknown): JSONContent | null {
  if (summary == null) return null;

  if (typeof summary === "object" && summary !== null && "type" in summary) {
    return summary as JSONContent;
  }

  if (typeof summary === "string") {
    const trimmed = summary.trim();
    if (trimmed === "") return null;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null && "type" in parsed) {
        return parsed as JSONContent;
      }
    } catch {
      // plain text
    }
    return {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: summary }] }],
    };
  }

  return null;
}

export type CatalogCourseHeaderProps = {
  course: CatalogCourseDetail;
};

export function CatalogCourseHeader({ course }: CatalogCourseHeaderProps) {
  const summaryDoc = courseSummaryToEditorContent(course.summary);
  const lessonCount = course.sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="shrink-0 lg:w-72">
        <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {course.imageUrl ? (
            <Image
              alt={course.title}
              className="size-full object-cover"
              height={360}
              src={course.imageUrl}
              width={640}
            />
          ) : (
            <BookOpenIcon className="size-10 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          <Badge size="sm" variant="outline">
            {COURSE_DIFFICULTY_LABELS[course.difficulty]}
          </Badge>
        </div>

        {course.instructors.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Instructors</span>
            <div className="flex -space-x-2">
              {course.instructors.map((i) => (
                <Avatar className="size-8 border-2 border-background" key={i.userId}>
                  {i.image ? <AvatarImage alt={i.name} src={buildImageUrl(i.image)} /> : null}
                  <AvatarFallback className="text-xs">
                    {getInitials(i.name).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        ) : null}

        {course.categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {course.categories.map((c) => (
              <Badge key={c.id} size="sm" variant="outline">
                {c.name}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>
            {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
          </span>
          <span>·</span>
          <span>Est. {formatMinutes(course.totalMinutes)}</span>
        </div>

        {course.description ? (
          <p className="text-sm leading-relaxed text-foreground">{course.description}</p>
        ) : null}

        {summaryDoc ? (
          <div className="pt-2">
            <RichTextEditor
              content={summaryDoc}
              contentClassName="font-sans"
              editable={false}
              editorContentClassName="min-h-0 border-0 bg-transparent px-0 py-1"
              mode="lightweight"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
