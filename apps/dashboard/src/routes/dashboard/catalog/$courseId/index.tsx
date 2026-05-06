import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { CatalogCertificatePreview } from "@/components/dashboard/catalog/catalog-certificate-preview";
import { CatalogCourseHeader } from "@/components/dashboard/catalog/catalog-course-header";
import {
  CatalogCourseInstructors,
  CatalogCourseSummary,
} from "@/components/dashboard/catalog/catalog-course-summary-instructors";
import { CatalogCurriculum } from "@/components/dashboard/catalog/catalog-curriculum";
import { CatalogEnrollCtaCard } from "@/components/dashboard/catalog/catalog-enroll-cta-card";
import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import { FadeIn } from "@/components/layout/motion-fade";

export const Route = createFileRoute("/dashboard/catalog/$courseId/")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.catalog.get.queryOptions({ courseId: params.courseId }),
      ),
      context.queryClient.ensureQueryData(context.trpc.profile.get.queryOptions()),
    ]);
  },
  component: CatalogCourseDetailPage,
});

function CatalogCourseDetailPage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { data: course } = useSuspenseQuery(trpc.catalog.get.queryOptions({ courseId }));

  return (
    <FadeIn className="flex flex-col gap-8 px-6 py-6" motionKey={courseId}>
      <div>
        <Button
          className="-ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => void navigate({ to: "/dashboard/catalog" })}
          size="xs"
          variant="ghost"
        >
          <ArrowLeftIcon />
          Back to catalog
        </Button>
      </div>

      <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-8">
          <CatalogCourseHeader course={course} />
        </div>
        <CatalogEnrollCtaCard courseId={courseId} detail={course} />
      </div>
      <CatalogCourseSummary summary={course.summary} />
      <CatalogCourseInstructors instructors={course.instructors} />

      <CatalogCurriculum sections={course.sections} />

      <CatalogCertificatePreview
        certificateId={course.certificateId}
        certificateSettings={course.certificateSettings}
        completed={course.completed}
        courseId={courseId}
        courseTitle={course.title}
      />
    </FadeIn>
  );
}
