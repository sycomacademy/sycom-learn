import { createFileRoute } from "@tanstack/react-router";

import { OrgStudentProfileFieldSettings } from "@/components/dashboard/org/org-student-profile-field-settings";

export const Route = createFileRoute("/dashboard/org/settings/student-profile")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.organization.getStudentProfileFields.queryOptions(),
    );
  },
  component: OrgStudentProfileFieldSettings,
});
