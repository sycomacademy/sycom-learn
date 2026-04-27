import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/users/public-invites")({
  component: AdminUsersPublicInvitesPage,
});

function AdminUsersPublicInvitesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Public invites</CardTitle>
        <CardDescription className="text-sm">
          Track and revoke public invitation links sent to prospective students. Management tools
          are coming soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
