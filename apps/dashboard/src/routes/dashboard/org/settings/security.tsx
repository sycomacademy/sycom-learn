import { createFileRoute } from "@tanstack/react-router";

import { SecuritySettings } from "@/routes/dashboard/settings/security";

export const Route = createFileRoute("/dashboard/org/settings/security")({
  component: SecuritySettings,
});
