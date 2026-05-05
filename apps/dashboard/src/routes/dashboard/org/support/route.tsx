import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/support")({
  component: OrgSupportLayout,
});

function OrgSupportLayout() {
  return <Outlet />;
}
