import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { FadeIn } from "@/components/layout/motion-fade";
import { useTRPC } from "@/lib/trpc/client";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import { Tabs, TabsList, TabsTab } from "@sycom/ui/components/tabs";

type CourseDetailTabRoute =
  | "/dashboard/course/$courseId"
  | "/dashboard/course/$courseId/curriculum"
  | "/dashboard/course/$courseId/members"
  | "/dashboard/course/$courseId/announcements"
  | "/dashboard/course/$courseId/analytics"
  | "/dashboard/course/$courseId/certificates";

/** Lesson editor is full-width; skip course title + tab bar (see `course/route.tsx` for list-level SecondaryMenu). */
function isLessonEditPath(pathname: string, courseId: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const prefix = `/dashboard/course/${courseId}/curriculum/`;
  return (
    (normalized.startsWith(prefix) && normalized.endsWith("/edit")) ||
    (normalized.startsWith(prefix) && normalized.endsWith("/view"))
  );
}

function getActiveCourseTab(pathname: string, courseId: string): CourseDetailTabRoute {
  const normalized = pathname.replace(/\/+$/, "");
  const base = `/dashboard/course/${courseId}`;

  if (normalized === base) {
    return "/dashboard/course/$courseId";
  }
  if (normalized === `${base}/curriculum`) {
    return "/dashboard/course/$courseId/curriculum";
  }
  if (normalized === `${base}/members`) {
    return "/dashboard/course/$courseId/members";
  }
  if (normalized === `${base}/analytics`) {
    return "/dashboard/course/$courseId/analytics";
  }
  if (normalized === `${base}/announcements`) {
    return "/dashboard/course/$courseId/announcements";
  }

  if (normalized === `${base}/certificates`) {
    return "/dashboard/course/$courseId/certificates";
  }

  return "/dashboard/course/$courseId";
}

export const Route = createFileRoute("/dashboard/course/$courseId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.course.get.queryOptions({ courseId: params.courseId }),
    );
  },
  component: CourseDetailLayout,
});

function CourseDetailLayout() {
  const { courseId } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: course } = useSuspenseQuery(trpc.course.get.queryOptions({ courseId }));

  const activeTab = getActiveCourseTab(pathname, courseId);
  const hideCourseDetailChrome = isLessonEditPath(pathname, courseId);

  if (hideCourseDetailChrome) {
    return (
      <FadeIn className="flex flex-col" motionKey={courseId}>
        <Outlet />
      </FadeIn>
    );
  }

  return (
    <FadeIn className="flex flex-col gap-6 px-6 py-6" motionKey={courseId}>
      <div>
        <Button
          className="-ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => void navigate({ to: "/dashboard/course" })}
          size="xs"
          variant="ghost"
        >
          <ArrowLeftIcon />
          Back to courses
        </Button>
        <div className="mt-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{course.title}</h1>
            <Badge size="sm" variant={course.status === "published" ? "default" : "secondary"}>
              {course.status === "published" ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{course.slug}</p>
        </div>
      </div>

      <Tabs aria-label="Course sections" className="gap-0" value={activeTab}>
        <TabsList
          className="-mx-1 w-full min-w-0 flex-wrap justify-start border-b border-border pb-0 sm:flex-nowrap"
          variant="underline"
        >
          <TabsTab
            nativeButton={false}
            render={<Link params={{ courseId }} to="/dashboard/course/$courseId" />}
            value="/dashboard/course/$courseId"
          >
            Details
          </TabsTab>
          <TabsTab
            nativeButton={false}
            render={<Link params={{ courseId }} to="/dashboard/course/$courseId/curriculum" />}
            value="/dashboard/course/$courseId/curriculum"
          >
            Curriculum
          </TabsTab>
          <TabsTab
            nativeButton={false}
            render={<Link params={{ courseId }} to="/dashboard/course/$courseId/members" />}
            value="/dashboard/course/$courseId/members"
          >
            Members
          </TabsTab>
          <TabsTab
            nativeButton={false}
            render={<Link params={{ courseId }} to="/dashboard/course/$courseId/analytics" />}
            value="/dashboard/course/$courseId/analytics"
          >
            Analytics
          </TabsTab>
          <TabsTab
            nativeButton={false}
            render={<Link params={{ courseId }} to="/dashboard/course/$courseId/announcements" />}
            value="/dashboard/course/$courseId/announcements"
          >
            Announcements
          </TabsTab>
          <TabsTab
            nativeButton={false}
            render={<Link params={{ courseId }} to="/dashboard/course/$courseId/certificates" />}
            value="/dashboard/course/$courseId/certificates"
          >
            Certificates
          </TabsTab>
        </TabsList>
      </Tabs>

      <Outlet />
    </FadeIn>
  );
}
