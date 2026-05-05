import { createFileRoute } from "@tanstack/react-router";

import { GeneralSettings } from "@/routes/dashboard/settings/general";

export const Route = createFileRoute("/dashboard/org/settings/general")({
  component: GeneralSettings,
});
