import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/organisation/setup")({
  component: OrganisationSetupPage,
  head: () => ({
    meta: [
      {
        title: "Organisation setup | Sycom LMS",
      },
    ],
  }),
});

function OrganisationSetupPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold tracking-tight">Organisation setup</h1>
      <p className="text-sm text-muted-foreground">
        This placeholder page confirms you reached organisation onboarding. Detailed setup flows
        will go here later.
      </p>
    </div>
  );
}
