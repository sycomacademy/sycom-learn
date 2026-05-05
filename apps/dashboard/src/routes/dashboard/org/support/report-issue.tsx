import { createFileRoute } from "@tanstack/react-router";

import { ReportIssuePage } from "@/routes/dashboard/support/report-issue";

export const Route = createFileRoute("/dashboard/org/support/report-issue")({
  component: ReportIssuePage,
});
