import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { buttonVariants } from "@sycom/ui/components/button";
import { cn } from "@sycom/ui/lib/utils";
import { Card, CardPanel, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";

import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/course/$courseId/curriculum/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.lesson.listByCourse.queryOptions({ courseId: params.courseId }),
    );
  },
  component: CurriculumIndexPage,
});

function CurriculumIndexPage() {
  const { courseId } = Route.useParams();
  const trpc = useTRPC();
  const { data: lessons } = useSuspenseQuery(trpc.lesson.listByCourse.queryOptions({ courseId }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Curriculum</CardTitle>
        <CardDescription>
          Lessons in this course. Edit lesson content or preview the learner view.
        </CardDescription>
      </CardHeader>
      <CardPanel>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No lessons yet. Add sections and lessons in the database to author content here.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="font-medium">{lesson.title}</span>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                    params={{ courseId, lessonId: lesson.id }}
                    to="/dashboard/course/$courseId/curriculum/$lessonId/edit"
                  >
                    Edit
                  </Link>
                  <Link
                    className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
                    params={{ courseId, lessonId: lesson.id }}
                    to="/dashboard/course/$courseId/curriculum/$lessonId/view"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardPanel>
    </Card>
  );
}
