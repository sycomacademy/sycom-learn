import { createFileRoute } from "@tanstack/react-router";

import { OrgStudentProfileFieldSettings } from "@/components/dashboard/org/org-student-profile-field-settings";

export const Route = createFileRoute("/dashboard/org/organization/rules")({
  head: () => ({
    meta: [{ title: "Rules | Organization | Sycom LMS" }],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.organization.getStudentProfileFields.queryOptions(),
    );
  },
  component: OrgOrganizationRulesPage,
});

function OrgOrganizationRulesPage() {
  return (
    <div className="space-y-6 px-6 pt-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Rules</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Org-wide policies for members, including custom data you collect on student profiles.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Student profile fields</h2>
          <p className="text-sm text-muted-foreground">
            Define extra fields for students in this organization (for example matric or university
            ID). Org admins set values from the Users directory.
          </p>
        </div>
        <OrgStudentProfileFieldSettings />
      </section>
    </div>
  );
}
