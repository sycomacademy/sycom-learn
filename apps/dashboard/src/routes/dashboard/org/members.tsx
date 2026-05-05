import { createFileRoute } from "@tanstack/react-router";

import { DashboardContent } from "@/components/dashboard/dashboard-home";
import { useUser } from "@/hooks/use-user";

export const Route = createFileRoute("/dashboard/org/members")({
  head: () => ({
    meta: [{ title: "Members | Organization | Sycom LMS" }],
  }),
  component: OrgMembersPlaceholderPage,
});

function OrgMembersPlaceholderPage() {
  const { data } = useUser();
  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-6 pt-4">
        <p className="text-sm text-muted-foreground">Members — Placeholder</p>
      </div>
      <DashboardContent data={data} />
    </>
  );
}
