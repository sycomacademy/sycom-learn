import { createFileRoute } from "@tanstack/react-router";

import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";

export const Route = createFileRoute("/dashboard/org/organization/rules")({
  head: () => ({
    meta: [{ title: "Rules | Organization | Sycom LMS" }],
  }),
  component: OrgOrganizationRulesPage,
});

function OrgOrganizationRulesPage() {
  return (
    <div className="px-6 pt-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Rules</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Org-wide policies for members and sign-in requirements.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Organization rules</CardTitle>
          <CardDescription className="text-sm">
            This is where org rules will live—things like allowed email formats, requiring
            two-factor authentication for every member, and other workspace-wide guardrails.
          </CardDescription>
        </CardHeader>
        <p className="px-6 pb-6 text-sm text-muted-foreground">Coming soon.</p>
      </Card>
    </div>
  );
}
