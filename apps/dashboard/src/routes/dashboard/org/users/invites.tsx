import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/users/invites")({
  head: () => ({
    meta: [{ title: "Invites | Users | Organization | Sycom LMS" }],
  }),
  component: OrgUsersInvitesPage,
});

function OrgUsersInvitesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-4">
      <h1 className="text-xl font-semibold tracking-tight">Invitations</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Invite and manage pending members here. This page is a placeholder until invitations are
        wired up.
      </p>
    </div>
  );
}
