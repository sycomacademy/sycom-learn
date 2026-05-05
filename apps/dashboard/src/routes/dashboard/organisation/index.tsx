import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/organisation/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/org", replace: true });
  },
});
