import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/learn/$courseId/")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      context.trpc.learn.getPlayerContext.queryOptions({ courseId: params.courseId }),
    );
    if (data.status === "ok" && data.nextLessonId) {
      throw redirect({
        to: "/learn/$courseId/$lessonId",
        params: { courseId: params.courseId, lessonId: data.nextLessonId },
      });
    }
  },
  component: LearnCourseIndexFallback,
});

function LearnCourseIndexFallback() {
  const { courseId } = Route.useParams();

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto p-8 text-center">
      <p className="text-muted-foreground">This course does not have any lessons yet.</p>
      <p className="font-mono text-xs text-muted-foreground">{courseId}</p>
    </div>
  );
}
