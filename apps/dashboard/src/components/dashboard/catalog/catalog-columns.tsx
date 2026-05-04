import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Image } from "@sycom/ui/image";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials } from "@sycom/ui/lib/string";
import { createColumnHelper } from "@tanstack/react-table";

import { BookOpenIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { COURSE_DIFFICULTY_LABELS, formatMinutes, type CatalogRow } from "./catalog-schema";

function CourseCell({ course }: { course: CatalogRow }) {
  return (
    <Link
      params={{ courseId: course.id }}
      preload="intent"
      to="/dashboard/catalog/$courseId"
      className="flex max-w-72 min-w-0 items-center gap-3"
    >
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {course.imageUrl ? (
          <Image
            alt={course.title}
            className="size-full object-cover"
            height={40}
            src={course.imageUrl}
            width={40}
          />
        ) : (
          <BookOpenIcon className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{course.title}</p>
        <p className="truncate text-xs text-muted-foreground">{course.slug}</p>
      </div>
    </Link>
  );
}

function InstructorsCell({ course }: { course: CatalogRow }) {
  if (course.instructors.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const visible = course.instructors.slice(0, 3);
  const extra = course.instructors.length - visible.length;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((i) => (
          <Avatar
            className="size-7 rounded-full border-2 border-background"
            key={`${course.id}-${i.userId}`}
          >
            {i.image ? <AvatarImage alt={i.name} src={buildImageUrl(i.image)} /> : null}
            <AvatarFallback className="text-[10px] font-medium text-muted-foreground">
              {getInitials(i.name).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {extra > 0 ? (
          <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
            +{extra}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CategoriesCell({ course }: { course: CatalogRow }) {
  if (course.categories.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const visible = course.categories.slice(0, 2);
  const extra = course.categories.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((c) => (
        <Badge key={c.id} size="sm" variant="outline">
          {c.name}
        </Badge>
      ))}
      {extra > 0 ? (
        <Badge size="sm" variant="secondary">
          +{extra}
        </Badge>
      ) : null}
    </div>
  );
}

const columnHelper = createColumnHelper<CatalogRow>();

export const CATALOG_COLUMNS = [
  columnHelper.accessor("title", {
    id: "title",
    header: "Course",
    cell: ({ row }) => <CourseCell course={row.original} />,
    enableSorting: true,
  }),
  columnHelper.accessor("difficulty", {
    id: "difficulty",
    header: "Difficulty",
    cell: ({ row }) => (
      <span className="text-sm">{COURSE_DIFFICULTY_LABELS[row.original.difficulty]}</span>
    ),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "instructors",
    header: "Instructors",
    cell: ({ row }) => <InstructorsCell course={row.original} />,
  }),
  columnHelper.display({
    id: "categories",
    header: "Categories",
    enableColumnFilter: true,
    cell: ({ row }) => <CategoriesCell course={row.original} />,
  }),
  columnHelper.display({
    id: "duration",
    header: "Est. time",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatMinutes(row.original.totalMinutes)}
      </span>
    ),
  }),
  columnHelper.display({
    id: "lessons",
    header: "Lessons",
    cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.lessonCount}</span>,
  }),
  columnHelper.display({
    id: "enrolled",
    header: "",
    cell: ({ row }) =>
      row.original.enrolled ? (
        <Badge size="sm" variant="default">
          Enrolled
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    meta: { className: "w-24" },
  }),
];
