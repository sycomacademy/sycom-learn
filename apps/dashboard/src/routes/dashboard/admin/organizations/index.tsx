import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/organizations/")({
  component: OrganizationsAllPage,
});

function OrganizationsAllPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">All organizations</CardTitle>
        <CardDescription className="text-sm">
          Every institution onboarded to the platform. Tenant directory and detail views are coming
          soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
