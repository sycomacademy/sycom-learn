import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/cohorts/$cohortId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/dashboard/org/cohorts/$cohortId/courses",
      params: { cohortId: params.cohortId },
      replace: true,
    });
  },
});
