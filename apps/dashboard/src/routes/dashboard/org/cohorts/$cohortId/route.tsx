import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { FadeIn } from "@/components/layout/motion-fade";
import { useTRPC } from "@/lib/trpc/client";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import { Tabs, TabsList, TabsTab } from "@sycom/ui/components/tabs";

type CohortDetailTabRoute =
  | "/dashboard/org/cohorts/$cohortId"
  | "/dashboard/org/cohorts/$cohortId/courses"
  | "/dashboard/org/cohorts/$cohortId/members";

function getActiveCohortTab(pathname: string, cohortId: string): CohortDetailTabRoute {
  const normalized = pathname.replace(/\/+$/, "");
  const base = `/dashboard/org/cohorts/${cohortId}`;

  if (normalized === base || normalized === `${base}/courses`) {
    return "/dashboard/org/cohorts/$cohortId/courses";
  }
  if (normalized === `${base}/members`) {
    return "/dashboard/org/cohorts/$cohortId/members";
  }

  return "/dashboard/org/cohorts/$cohortId/courses";
}

export const Route = createFileRoute("/dashboard/org/cohorts/$cohortId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.organization.getCohort.queryOptions({ cohortId: params.cohortId }),
    );
  },
  component: CohortDetailLayout,
});

function CohortDetailLayout() {
  const { cohortId } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: cohort } = useSuspenseQuery(trpc.organization.getCohort.queryOptions({ cohortId }));
  const activeTab = getActiveCohortTab(pathname, cohortId);

  return (
    <FadeIn className="flex flex-col gap-6 px-6 py-6" motionKey={cohortId}>
      <div>
        <Button
          className="-ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => void navigate({ to: "/dashboard/org/cohorts" })}
          size="xs"
          variant="ghost"
        >
          <ArrowLeftIcon />
          Back to cohorts
        </Button>
        <div className="mt-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{cohort.name}</h1>
            <Badge size="sm" variant="secondary">
              {cohort.memberCount} member{cohort.memberCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs aria-label="Cohort sections" className="gap-0" value={activeTab}>
        <TabsList
          className="-mx-1 w-full min-w-0 flex-wrap justify-start border-b border-border pb-0 sm:flex-nowrap"
          variant="underline"
        >
          <TabsTab
            nativeButton={false}
            render={<Link params={{ cohortId }} to="/dashboard/org/cohorts/$cohortId/courses" />}
            value="/dashboard/org/cohorts/$cohortId/courses"
          >
            Courses
          </TabsTab>
          <TabsTab
            nativeButton={false}
            render={<Link params={{ cohortId }} to="/dashboard/org/cohorts/$cohortId/members" />}
            value="/dashboard/org/cohorts/$cohortId/members"
          >
            Members
          </TabsTab>
        </TabsList>
      </Tabs>

      <Outlet />
    </FadeIn>
  );
}
