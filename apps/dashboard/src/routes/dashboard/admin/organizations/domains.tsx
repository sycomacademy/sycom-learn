import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/organizations/domains")({
  component: AdminOrganizationsDomainsPage,
});

function AdminOrganizationsDomainsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Domains</CardTitle>
        <CardDescription className="text-sm">
          Verified email domains used to route students into the right institution. Verification
          tooling is coming soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
