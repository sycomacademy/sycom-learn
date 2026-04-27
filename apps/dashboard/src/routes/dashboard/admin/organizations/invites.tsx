import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/organizations/invites")({
  component: AdminOrganizationsInvitesPage,
});

function AdminOrganizationsInvitesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Invites</CardTitle>
        <CardDescription className="text-sm">
          Pending invitations sent to institution administrators. Send, resend, and revoke flows are
          coming soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
