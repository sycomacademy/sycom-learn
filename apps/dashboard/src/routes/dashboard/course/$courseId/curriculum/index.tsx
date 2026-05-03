import { createFileRoute } from "@tanstack/react-router";

import { CurriculumBoard } from "@/components/dashboard/course/curriculum-board";

export const Route = createFileRoute("/dashboard/course/$courseId/curriculum/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.course.getCurriculum.queryOptions({ courseId: params.courseId }),
    );
  },
  component: CurriculumIndexPage,
});

function CurriculumIndexPage() {
  const { courseId } = Route.useParams();

  return <CurriculumBoard courseId={courseId} />;
}
