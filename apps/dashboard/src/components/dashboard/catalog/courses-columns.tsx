import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Image } from "@sycom/ui/image";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { formatDate } from "@sycom/ui/lib/date";
import { getInitials } from "@sycom/ui/lib/string";
import { createColumnHelper } from "@tanstack/react-table";
import { BookOpenIcon } from "lucide-react";

import { CourseActions } from "./courses-actions";
import {
  COURSE_DIFFICULTY_LABELS,
  COURSE_STATUS_LABELS,
  COURSE_STATUS_VARIANTS,
  type CourseRow,
} from "./courses-schema";

function CourseCell({ course }: { course: CourseRow }) {
  return (
    <div className="flex max-w-72 min-w-0 items-center gap-3">
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
    </div>
  );
}

function InstructorsCell({ course }: { course: CourseRow }) {
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

function CategoriesCell({ course }: { course: CourseRow }) {
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

const columnHelper = createColumnHelper<CourseRow>();

export const COURSE_COLUMNS = [
  columnHelper.accessor("title", {
    id: "title",
    header: "Course",
    cell: ({ row }) => <CourseCell course={row.original} />,
    enableSorting: true,
  }),
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge size="sm" variant={COURSE_STATUS_VARIANTS[row.original.status]}>
        {COURSE_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
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
    cell: ({ row }) => <CategoriesCell course={row.original} />,
  }),
  columnHelper.accessor("updatedAt", {
    id: "updatedAt",
    header: "Updated",
    cell: ({ row }) => formatDate(row.original.updatedAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <CourseActions course={row.original} />,
    meta: { headerClassName: "w-10", className: "w-10 pe-2 text-end" },
  }),
];
