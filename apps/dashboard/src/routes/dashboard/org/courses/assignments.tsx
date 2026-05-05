import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/courses/assignments")({
  head: () => ({
    meta: [{ title: "Assignments | Courses | Organization | Sycom LMS" }],
  }),
  component: OrgCoursesAssignmentsPage,
});

function OrgCoursesAssignmentsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-4">
      <h1 className="text-xl font-semibold tracking-tight">Assignments</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Track coursework and deadlines for this organization—placeholder until assignments connect
        to the catalog.
      </p>
    </div>
  );
}
