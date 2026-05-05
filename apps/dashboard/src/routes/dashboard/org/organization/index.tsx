import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/organization/")({
  head: () => ({
    meta: [{ title: "Organization | Sycom LMS" }],
  }),
  component: OrgOrganizationProfilePage,
});

function OrgOrganizationProfilePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-4">
      <h1 className="text-xl font-semibold tracking-tight">Organization</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Organization profile will live here—separate from your personal account settings.
      </p>
    </div>
  );
}
