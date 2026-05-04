import { useQuery } from "@tanstack/react-query";

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
} from "@sycom/ui/components/sheet";
import { Spinner } from "@sycom/ui/components/spinner";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials } from "@sycom/ui/lib/string";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function CourseEnrollmentDetailSheet({
  courseId,
  enrollmentId,
  open,
  onOpenChange,
}: {
  courseId: string;
  enrollmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const trpc = useTRPC();
  const detailQuery = useQuery({
    ...trpc.enrollment.getEnrollmentDetail.queryOptions(
      enrollmentId ? { courseId, enrollmentId } : { courseId, enrollmentId: "" },
    ),
    enabled: open && !!enrollmentId,
  });

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetPopup variant="inset">
        {!enrollmentId || detailQuery.isLoading ? (
          <SheetPanel className="flex min-h-64 items-center justify-center">
            <Spinner className="size-5" />
          </SheetPanel>
        ) : detailQuery.error || !detailQuery.data ? (
          <>
            <SheetHeader>
              <SheetTitle>Couldn&apos;t load student</SheetTitle>
              <SheetDescription>
                {detailQuery.error?.message ?? "The enrollment detail is unavailable right now."}
              </SheetDescription>
            </SheetHeader>
            <SheetFooter variant="bare">
              <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
            </SheetFooter>
          </>
        ) : (
          (() => {
            const student = detailQuery.data;
            const completedCount = student.lessons.filter(
              (lesson) => lesson.status === "completed",
            ).length;

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
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{student.status}</Badge>
                        <Badge variant={student.certificateIssued ? "success" : "secondary"}>
                          {student.certificateIssued ? "Certificate issued" : "No certificate yet"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                <SheetPanel>
                  <dl>
                    <DetailRow
                      label="Profile"
                      value={student.bio?.trim() ? student.bio : "No bio"}
                    />
                    <DetailRow
                      label="Progress"
                      value={`${completedCount}/${student.lessons.length} lessons completed`}
                    />
                    <DetailRow
                      label="Last activity"
                      value={
                        student.lastActivityAt
                          ? student.lastActivityAt.toLocaleString()
                          : "No activity yet"
                      }
                    />
                    <DetailRow
                      label="Assessments"
                      value={
                        <div className="space-y-2">
                          {student.lessons
                            .filter(
                              (lesson) =>
                                lesson.lessonType === "quiz" || lesson.lessonType === "exam",
                            )
                            .map((lesson) => (
                              <div key={lesson.lessonId}>
                                <p>{lesson.lessonTitle}</p>
                                <p className="text-xs text-muted-foreground">
                                  Best: {lesson.bestScore ?? "-"} / Latest:{" "}
                                  {lesson.latestScore ?? "-"} / Attempts: {lesson.attemptCount}
                                </p>
                              </div>
                            ))}
                        </div>
                      }
                    />
                  </dl>
                </SheetPanel>

                <SheetFooter variant="bare">
                  <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
                </SheetFooter>
              </>
            );
          })()
        )}
      </SheetPopup>
    </Sheet>
  );
}
