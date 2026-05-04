import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/learn/course/$courseId")({
  component: LearnCourseLayout,
});

function LearnCourseLayout() {
  return <Outlet />;
}
