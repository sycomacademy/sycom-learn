import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { CollapseFade } from "@/components/layout/motion-fade";
import { SecondaryMenu } from "@/components/dashboard/secondary-menu";

export const Route = createFileRoute("/dashboard/course")({
  component: CourseLayout,
});

/** Courses list + Categories only — hide while viewing a `$courseId` branch. */
function useShowCourseSecondaryMenu(): boolean {
  return useRouterState({
    select: (state) => {
      const p = state.location.pathname.replace(/\/+$/, "") || "/";
      return p === "/dashboard/course" || p === "/dashboard/course/categories";
    },
  });
}

function CourseLayout() {
  const showSecondaryMenu = useShowCourseSecondaryMenu();

  return (
    <div className="mb-10 max-w-6xl md:ml-10">
      <CollapseFade show={showSecondaryMenu}>
        <SecondaryMenu
          base="/dashboard/course"
          items={[
            { path: "/dashboard/course", label: "Courses" },
            { path: "/dashboard/course/categories", label: "Categories" },
          ]}
          label="Courses"
        />
      </CollapseFade>

      <section>
        <Outlet />
      </section>
    </div>
  );
}
