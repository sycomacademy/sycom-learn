import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen, BookOpenIcon, ChevronRight, GraduationCap, Library } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";
import {
  OverviewListEmpty,
  OverviewStatCard,
} from "@/components/dashboard/admin/overview/overview-primitives";
import { SelfCourseScoresSheetContent } from "@/components/dashboard/course/course-analytics-student-details";
import { FadeIn } from "@/components/layout/motion-fade";
import { useTRPC } from "@/lib/trpc/client";
import { Badge } from "@sycom/ui/components/badge";
import { Button, buttonVariants } from "@sycom/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sycom/ui/components/card";
import { Progress } from "@sycom/ui/components/progress";
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
import { Image } from "@sycom/ui/image";
import { formatShortMonthDay } from "@sycom/ui/lib/date";
import { cn } from "@sycom/ui/lib/utils";

type LibraryData = AppRouterOutputs["student"]["getLibrary"];
type LibraryCourseRow = LibraryData["courses"][number];
type LibrarySectionRow = LibraryCourseRow["sections"][number];

export const Route = createFileRoute("/dashboard/library/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.student.getLibrary.queryOptions({}));
  },
  component: LibraryPage,
});

function getProgressPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getEnrollmentStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "In progress";
    case "completed":
      return "Completed";
    case "dropped":
      return "Dropped";
    default:
      return capitalize(status);
  }
}

function findNextSection(sections: LibrarySectionRow[]): LibrarySectionRow | null {
  for (const section of sections) {
    if (section.completedLessonCount < section.totalLessonCount) {
      return section;
    }
  }
  return null;
}

function LibraryPage() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.student.getLibrary.queryOptions({}));

  return (
    <FadeIn className="flex flex-col gap-6 px-6 py-6" motionKey="library">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My library</h1>
        <p className="text-sm text-muted-foreground">
          Track every course you’re in and grab any certificates you’ve earned.
        </p>
      </div>

      <LibraryStatsSection data={data} />
      <LibraryCoursesSection courses={data.courses} />
    </FadeIn>
  );
}

function LibraryStatsSection({ data }: { data: LibraryData }): React.ReactElement {
  const { totals } = data;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <OverviewStatCard
        description="Published courses you’re enrolled in (active or completed)."
        icon={Library}
        title="Enrolled"
        value={totals.enrolledCourses.toLocaleString()}
      />
      <OverviewStatCard
        description="Courses you’re currently working through."
        icon={BookOpen}
        title="In progress"
        value={totals.inProgressCourses.toLocaleString()}
      />
      <OverviewStatCard
        description="Courses you’ve finished end to end."
        icon={GraduationCap}
        title="Completed"
        value={totals.completedCourses.toLocaleString()}
      />
    </div>
  );
}

function LibraryCoursesSection({ courses }: { courses: LibraryCourseRow[] }): React.ReactElement {
  if (courses.length === 0) {
    return (
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>My courses</CardTitle>
          <CardDescription>
            Every course you’re enrolled in, ordered by your latest activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewListEmpty
            description="Browse the catalog to enroll in a course and your progress will show up here."
            title="No courses yet"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {courses.map((course) => (
        <LibraryCourseCard course={course} key={course.courseId} />
      ))}
    </div>
  );
}

function LibraryCourseCard({ course }: { course: LibraryCourseRow }): React.ReactElement {
  const progressPercent = getProgressPercent(course.completedLessonCount, course.totalLessonCount);
  const allDone =
    course.totalLessonCount > 0 && course.completedLessonCount >= course.totalLessonCount;
  const sections = useMemo(() => course.sections ?? [], [course.sections]);
  const nextSection = useMemo(() => findNextSection(sections), [sections]);
  const statusLabel = getEnrollmentStatusLabel(course.enrollmentStatus);

  return (
    <Card className="overflow-hidden shadow-xs">
      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <CourseCardCover course={course} statusLabel={statusLabel} />
        <div className="flex min-w-0 flex-col gap-4 p-5">
          <p className="truncate text-base font-semibold">{course.title}</p>

          <div className="flex flex-col gap-2 border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Module progress</span>
              <span className="text-sm text-muted-foreground tabular-nums">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent}>
              <div className="block h-1.5 w-full overflow-hidden rounded-full bg-input">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </Progress>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {allDone
                  ? "All lessons complete"
                  : `${course.completedLessonCount} of ${course.totalLessonCount} lessons completed`}
              </span>
              {nextSection ? (
                <span className="truncate">
                  Next:{" "}
                  <span className="font-medium tracking-wide text-foreground uppercase">
                    {nextSection.title}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          {sections.length > 0 ? (
            <ul className="space-y-0.5">
              {sections.map((section) => (
                <CourseSectionRow
                  isCurrent={nextSection?.sectionId === section.sectionId}
                  key={section.sectionId}
                  section={section}
                />
              ))}
            </ul>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <LibraryCourseScoresSheet courseId={course.courseId} courseTitle={course.title} />
            <Link
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              params={{ courseId: course.courseId }}
              to="/dashboard/catalog/$courseId"
            >
              See full module
            </Link>
            {course.nextLessonId ? (
              <Link
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                params={{ courseId: course.courseId, lessonId: course.nextLessonId }}
                to="/learn/$courseId/$lessonId"
              >
                {allDone ? "Review course" : "Continue learning"}
                <ChevronRight className="ml-1 size-3.5" />
              </Link>
            ) : (
              <Link
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                params={{ courseId: course.courseId }}
                to="/learn/$courseId"
              >
                {allDone ? "Review course" : "Continue learning"}
                <ChevronRight className="ml-1 size-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function LibraryCourseScoresSheet({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}): React.ReactElement {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const detailQuery = useQuery({
    ...trpc.student.getCourseScores.queryOptions({ courseId }),
    enabled: open,
  });

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        render={
          <Button size="sm" variant="outline">
            See scores
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
              <SheetTitle>Couldn&apos;t load scores</SheetTitle>
              <SheetDescription>
                {detailQuery.error?.message ?? "Scores are unavailable right now."}
              </SheetDescription>
            </SheetHeader>
            <SheetFooter variant="bare">
              <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
            </SheetFooter>
          </>
        ) : (
          <SelfCourseScoresSheetContent courseTitle={courseTitle} student={detailQuery.data} />
        )}
      </SheetPopup>
    </Sheet>
  );
}

function CourseCardCover({
  course,
  statusLabel,
}: {
  course: LibraryCourseRow;
  statusLabel: string;
}): React.ReactElement {
  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-muted lg:aspect-auto lg:min-h-[260px]">
      {course.imageUrl ? (
        <Image
          alt={course.title}
          className="size-full object-cover"
          height={360}
          src={course.imageUrl}
          width={640}
        />
      ) : (
        <BookOpenIcon className="size-8 text-muted-foreground" />
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 px-4 pt-12 pb-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge size="sm" variant="default">
              {statusLabel}
            </Badge>
            <Badge size="sm" variant="outline">
              {capitalize(course.difficulty)}
            </Badge>
          </div>
          {course.startedAt ? (
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Enrolled {formatShortMonthDay(course.startedAt)}
            </p>
          ) : null}
        </div>
        <Badge className="gap-1.5" size="sm" variant="outline">
          <BookOpenIcon className="size-3.5" />
          {course.totalLessonCount} lessons
        </Badge>
      </div>
    </div>
  );
}

function CourseSectionRow({
  section,
  isCurrent,
}: {
  section: LibrarySectionRow;
  isCurrent: boolean;
}): React.ReactElement {
  const isComplete =
    section.totalLessonCount > 0 && section.completedLessonCount >= section.totalLessonCount;

  return (
    <li className="flex w-full items-center gap-3 border px-5 py-3 text-left transition-colors hover:bg-muted/40">
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium">{section.title}</p>
        <p className="text-xs text-muted-foreground">
          {isComplete
            ? "All lessons complete"
            : `${section.completedLessonCount} / ${section.totalLessonCount} lessons complete`}
        </p>
      </div>
      {isCurrent ? (
        <Badge size="sm" variant="secondary">
          Current
        </Badge>
      ) : null}
    </li>
  );
}
