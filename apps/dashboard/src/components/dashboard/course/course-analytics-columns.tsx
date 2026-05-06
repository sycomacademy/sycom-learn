import { createColumnHelper } from "@tanstack/react-table";

import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials } from "@sycom/ui/lib/string";

import { StudentDetailsTrigger } from "./course-analytics-student-details";
import type { CourseAnalyticsStudentRow } from "./course-analytics-schema";

function StudentCell({ student }: { student: CourseAnalyticsStudentRow }) {
  return (
    <div className="flex max-w-72 min-w-0 items-center gap-3">
      <Avatar className="size-8 rounded-md">
        {student.image ? (
          <AvatarImage alt={student.name} src={buildImageUrl(student.image)} />
        ) : null}
        <AvatarFallback className="rounded-md text-xs font-medium text-muted-foreground">
          {getInitials(student.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{student.name}</p>
        <p className="truncate text-xs text-muted-foreground">{student.email}</p>
      </div>
    </div>
  );
}

function ProgressCell({ completed, total }: { completed: number; total: number }) {
  if (total === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="tabular-nums">
      {completed}
      <span className="text-muted-foreground">/{total}</span>
    </span>
  );
}

const columnHelper = createColumnHelper<CourseAnalyticsStudentRow>();

export function buildAnalyticsColumns(
  courseId: string,
  options?: { analyticsProcedureRouter?: "course" | "orgCourse" },
) {
  const analyticsProcedureRouter = options?.analyticsProcedureRouter ?? "course";
  return [
    columnHelper.accessor("name", {
      id: "name",
      header: "Student",
      cell: ({ row }) => <StudentCell student={row.original} />,
      enableSorting: true,
    }),
    columnHelper.display({
      id: "lessonProgress",
      header: "Lesson progress",
      cell: ({ row }) => (
        <ProgressCell
          completed={row.original.articleCompletedCount}
          total={row.original.articleTotalCount}
        />
      ),
    }),
    columnHelper.display({
      id: "quizProgress",
      header: "Quiz progress",
      cell: ({ row }) => (
        <ProgressCell
          completed={row.original.quizCompletedCount}
          total={row.original.quizTotalCount}
        />
      ),
    }),
    columnHelper.display({
      id: "examProgress",
      header: "Exam progress",
      cell: ({ row }) => (
        <ProgressCell
          completed={row.original.examCompletedCount}
          total={row.original.examTotalCount}
        />
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <StudentDetailsTrigger
          analyticsProcedureRouter={analyticsProcedureRouter}
          courseId={courseId}
          enrollmentId={row.original.enrollmentId}
        />
      ),
      meta: { headerClassName: "w-32", className: "w-32 pe-2 text-end" },
    }),
  ];
}
