import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/settings/")({
  beforeLoad: () => {
    throw redirect({
      to: "/dashboard/org/settings/general",
      replace: true,
    });
  },
});
