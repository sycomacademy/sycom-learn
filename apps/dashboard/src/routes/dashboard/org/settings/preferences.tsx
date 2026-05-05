import { createFileRoute } from "@tanstack/react-router";

import { PreferencesSettings } from "@/routes/dashboard/settings/preferences";

export const Route = createFileRoute("/dashboard/org/settings/preferences")({
  component: PreferencesSettings,
});
