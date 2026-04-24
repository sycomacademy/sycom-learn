import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings/general")({
  component: GeneralSettings,
});

function GeneralSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>Coming soon.</CardDescription>
      </CardHeader>
    </Card>
  );
}
