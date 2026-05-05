import { createFileRoute } from "@tanstack/react-router";

import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";

export const Route = createFileRoute("/dashboard/org/organization/integrations")({
  head: () => ({
    meta: [{ title: "Integrations | Organization | Sycom LMS" }],
  }),
  component: OrgOrganizationIntegrationsPage,
});

function OrgOrganizationIntegrationsPage() {
  return (
    <div className="px-6 pt-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect external tools to your organization workspace.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Third-party connections</CardTitle>
          <CardDescription className="text-sm">
            SSO, webhooks, and directory sync will appear here.
          </CardDescription>
        </CardHeader>
        <p className="px-6 pb-6 text-sm text-muted-foreground">Coming soon.</p>
      </Card>
    </div>
  );
}
