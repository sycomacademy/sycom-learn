import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/users/roles")({
  component: AdminUsersRolesPage,
});

function AdminUsersRolesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Roles</CardTitle>
        <CardDescription className="text-sm">
          Review platform role assignments and override access for individual accounts. Editing is
          coming soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
