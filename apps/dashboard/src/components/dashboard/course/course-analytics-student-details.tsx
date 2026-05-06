import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useTRPC } from "@/lib/trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@sycom/ui/components/sheet";
import { Spinner } from "@sycom/ui/components/spinner";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials } from "@sycom/ui/lib/string";

import type {
  CourseAnalyticsLesson,
  CourseAnalyticsStudentDetail,
} from "./course-analytics-schema";

function ScorePill({ lesson }: { lesson: CourseAnalyticsLesson }) {
  if (lesson.bestScore == null || lesson.maxScore === 0) {
    return <Badge variant="secondary">No attempt</Badge>;
  }
  const percent = Math.round((lesson.bestScore / lesson.maxScore) * 100);
  const variant = percent === 100 ? "success" : percent >= 50 ? "default" : "warning";
  return (
    <Badge variant={variant}>
      {lesson.bestScore}/{lesson.maxScore} ({percent}%)
    </Badge>
  );
}

function SectionEmpty({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

function LessonList({
  emptyMessage,
  items,
  showScore,
}: {
  emptyMessage: string;
  items: CourseAnalyticsLesson[];
  showScore: boolean;
}) {
  if (items.length === 0) return <SectionEmpty message={emptyMessage} />;
  return (
    <ul className="space-y-2">
      {items.map((lesson) => (
        <li
          className="flex items-start justify-between gap-3 border px-3 py-2"
          key={lesson.lessonId}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{lesson.title}</p>
            <p className="truncate text-xs text-muted-foreground">{lesson.sectionTitle}</p>
          </div>
          <div className="shrink-0">
            {showScore ? (
              <ScorePill lesson={lesson} />
            ) : lesson.status === "completed" ? (
              <Badge variant="success">Completed</Badge>
            ) : (
              <Badge variant="secondary">Pending</Badge>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h4>
  );
}

export function CourseScoresPanel({ student }: { student: CourseAnalyticsStudentDetail }) {
  const completedArticles = student.articles.filter((lesson) => lesson.status === "completed");
  return (
    <SheetPanel className="space-y-6">
      <div className="space-y-2">
        <SectionHeading>
          Completed lessons ({completedArticles.length}/{student.articles.length})
        </SectionHeading>
        <LessonList
          emptyMessage="No lessons completed yet."
          items={completedArticles}
          showScore={false}
        />
      </div>
      <div className="space-y-2">
        <SectionHeading>Quizzes ({student.quizzes.length})</SectionHeading>
        <LessonList emptyMessage="This course has no quizzes." items={student.quizzes} showScore />
      </div>
      <div className="space-y-2">
        <SectionHeading>Exams ({student.exams.length})</SectionHeading>
        <LessonList emptyMessage="This course has no exams." items={student.exams} showScore />
      </div>
    </SheetPanel>
  );
}

function StudentDetailContent({ student }: { student: CourseAnalyticsStudentDetail }) {
  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-4 pe-8">
          <Avatar className="size-12 rounded-md">
            {student.image ? (
              <AvatarImage alt={student.name} src={buildImageUrl(student.image)} />
            ) : null}
            <AvatarFallback className="rounded-md text-sm font-medium text-muted-foreground">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div>
              <SheetTitle>{student.name}</SheetTitle>
              <SheetDescription className="truncate">{student.email}</SheetDescription>
            </div>
            <Badge variant="outline">{student.enrollmentStatus}</Badge>
          </div>
        </div>
      </SheetHeader>

      <CourseScoresPanel student={student} />

      <SheetFooter variant="bare">
        <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
      </SheetFooter>
    </>
  );
}

export function SelfCourseScoresSheetContent({
  courseTitle,
  student,
}: {
  courseTitle: string;
  student: CourseAnalyticsStudentDetail;
}) {
  return (
    <>
      <SheetHeader>
        <div className="space-y-2 pe-8">
          <SheetTitle>{courseTitle}</SheetTitle>
          <SheetDescription>
            Completed lessons, quizzes, and exam scores for this course.
          </SheetDescription>
          <Badge variant="outline">{student.enrollmentStatus}</Badge>
        </div>
      </SheetHeader>

      <CourseScoresPanel student={student} />

      <SheetFooter variant="bare">
        <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
      </SheetFooter>
    </>
  );
}

export function StudentDetailsTrigger({
  courseId,
  enrollmentId,
  analyticsProcedureRouter = "course",
}: {
  courseId: string;
  enrollmentId: string;
  analyticsProcedureRouter?: "course" | "orgCourse";
}) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const analyticsApi = analyticsProcedureRouter === "orgCourse" ? trpc.orgCourse : trpc.course;
  const detailQuery = useQuery({
    ...analyticsApi.getAnalyticsStudent.queryOptions({ courseId, enrollmentId }),
    enabled: open,
  });

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        render={
          <Button size="sm" variant="outline">
            View details
          </Button>
        }
      />
      <SheetPopup variant="inset">
        {detailQuery.isLoading ? (
          <SheetPanel className="flex min-h-64 items-center justify-center">
            <Spinner className="size-5" />
          </SheetPanel>
        ) : detailQuery.error || !detailQuery.data ? (
          <>
            <SheetHeader>
              <SheetTitle>Couldn&apos;t load student</SheetTitle>
              <SheetDescription>
                {detailQuery.error?.message ?? "Student detail is unavailable right now."}
              </SheetDescription>
            </SheetHeader>
            <SheetFooter variant="bare">
              <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
            </SheetFooter>
          </>
        ) : (
          <StudentDetailContent student={detailQuery.data} />
        )}
      </SheetPopup>
    </Sheet>
  );
}
