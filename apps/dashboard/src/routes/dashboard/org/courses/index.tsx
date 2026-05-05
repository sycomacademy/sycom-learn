import { createFileRoute } from "@tanstack/react-router";

import { DashboardContent } from "@/components/dashboard/dashboard-home";
import { useUser } from "@/hooks/use-user";

export const Route = createFileRoute("/dashboard/org/courses/")({
  head: () => ({
    meta: [{ title: "Courses | Organization | Sycom LMS" }],
  }),
  component: OrgCoursesCatalogPage,
});

function OrgCoursesCatalogPage() {
  const { data } = useUser();
  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-6 pt-4">
        <p className="text-sm text-muted-foreground">Courses — Placeholder</p>
      </div>
      <DashboardContent data={data} />
    </>
  );
}
