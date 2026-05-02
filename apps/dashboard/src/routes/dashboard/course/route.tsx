import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";

export const Route = createFileRoute("/dashboard/course")({
  component: CourseLayout,
});

function CourseLayout() {
  return (
    <div className="mb-10 max-w-6xl md:ml-10">
      <SecondaryMenu
        base="/dashboard/course"
        items={[
          { path: "/dashboard/course", label: "Courses" },
          { path: "/dashboard/course/categories", label: "Categories" },
        ]}
        label="Courses"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
