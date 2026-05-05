import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/settings")({
  component: OrgSettingsLayout,
});

function OrgSettingsLayout() {
  return <Outlet />;
}
