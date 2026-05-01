import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/onboarding/organization")({
  component: OrganizationOnboardingPage,
  head: () => ({
    meta: [
      {
        title: "Organization setup | Sycom LMS",
      },
    ],
  }),
});

function OrganizationOnboardingPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold tracking-tight">Organization setup</h1>
      <p className="text-sm text-muted-foreground">
        This placeholder page confirms you reached organization onboarding. Detailed setup flows
        will go here later.
      </p>
    </div>
  );
}
