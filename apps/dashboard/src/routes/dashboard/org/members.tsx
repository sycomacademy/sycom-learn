import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/members")({
  beforeLoad: () => {
    throw redirect({
      to: "/dashboard/org/users",
      replace: true,
    });
  },
});
