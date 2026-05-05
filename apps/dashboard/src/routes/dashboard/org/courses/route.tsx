"use client";

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";
import type { SecondaryMenuItem } from "@/components/dashboard/secondary-menu";
import type { TRoutes } from "@/router";
import { cn } from "@sycom/ui/lib/utils";

export const Route = createFileRoute("/dashboard/org/courses")({
  component: OrgCoursesSectionLayout,
});

const coursesSectionPaths = {
  base: "/dashboard/org/courses" satisfies TRoutes,
  items: [
    { path: "/dashboard/org/courses", label: "Catalog" },
    { path: "/dashboard/org/courses/assignments", label: "Assignments" },
  ],
} satisfies { base: TRoutes; items: SecondaryMenuItem[] };

function OrgCoursesSectionLayout() {
  return (
    <div className={cn("mx-auto w-full max-w-6xl")}>
      <SecondaryMenu
        base={coursesSectionPaths.base}
        items={coursesSectionPaths.items}
        label="Courses"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
