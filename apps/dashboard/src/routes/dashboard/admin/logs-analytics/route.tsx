import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";

export const Route = createFileRoute("/dashboard/admin/logs-analytics")({
  component: LogsAnalyticsLayout,
});

function LogsAnalyticsLayout() {
  return (
    <div className="mb-10 max-w-4xl md:ml-10">
      <SecondaryMenu
        base="/dashboard/admin/logs-analytics"
        items={[
          { path: "/dashboard/admin/logs-analytics", label: "Activity" },
          { path: "/dashboard/admin/logs-analytics/reports", label: "Reports" },
          { path: "/dashboard/admin/logs-analytics/feedback", label: "Feedback" },
        ]}
        label="Logs and analytics"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
