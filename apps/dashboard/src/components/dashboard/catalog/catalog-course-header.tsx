import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { Badge } from "@sycom/ui/components/badge";
import { Image } from "@sycom/ui/image";
import { BookOpenIcon } from "lucide-react";

import { COURSE_DIFFICULTY_LABELS, formatMinutes } from "./catalog-schema";

type CatalogCourseDetail = AppRouterOutputs["catalog"]["get"];

export type CatalogCourseHeaderProps = {
  course: CatalogCourseDetail;
};

export function CatalogCourseHeader({ course }: CatalogCourseHeaderProps) {
  const lessonCount = course.sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="w-40 shrink-0 sm:w-56 lg:w-72">
        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {course.imageUrl ? (
            <Image
              alt={course.title}
              className="size-full object-cover"
              layout="fullWidth"
              src={course.imageUrl}
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

        {course.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {course.categories.map((c) => (
              <Badge key={c.id} size="sm" variant="outline">
                {c.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>
            {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
          </span>
          <span>·</span>
          <span>Est. {formatMinutes(course.totalMinutes)}</span>
        </div>

        {course.description && (
          <p className="text-sm leading-relaxed text-foreground">{course.description}</p>
        )}
      </div>
    </div>
  );
}
