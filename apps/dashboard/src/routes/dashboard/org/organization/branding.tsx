import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/organization/branding")({
  head: () => ({
    meta: [{ title: "Branding | Organization | Sycom LMS" }],
  }),
  component: OrgOrganizationBrandingPage,
});

function OrgOrganizationBrandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-4">
      <h1 className="text-xl font-semibold tracking-tight">Branding</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Logo and visual identity settings for your organization—placeholder for now.
      </p>
    </div>
  );
}
