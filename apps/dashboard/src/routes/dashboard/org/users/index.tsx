import { createFileRoute } from "@tanstack/react-router";

import { DashboardContent } from "@/components/dashboard/dashboard-home";
import { useUser } from "@/hooks/use-user";

export const Route = createFileRoute("/dashboard/org/users/")({
  head: () => ({
    meta: [{ title: "Users | Organization | Sycom LMS" }],
  }),
  component: OrgUsersMembersPage,
});

function OrgUsersMembersPage() {
  const { data } = useUser();
  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-6 pt-4">
        <p className="text-sm text-muted-foreground">Users — Placeholder</p>
      </div>
      <DashboardContent data={data} />
    </>
  );
}
