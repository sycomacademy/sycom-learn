import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings/preferences")({
  component: PreferencesSettings,
});

function PreferencesSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Coming soon.</CardDescription>
      </CardHeader>
    </Card>
  );
}
