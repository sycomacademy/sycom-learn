import { createFileRoute } from "@tanstack/react-router";

import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";

export const Route = createFileRoute("/dashboard/course/$courseId/certificates")({
  component: CourseCertificatesPlaceholderPage,
});

function CourseCertificatesPlaceholderPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificates</CardTitle>
        <CardDescription>Templates and issuance rules will live here.</CardDescription>
      </CardHeader>
      <CardPanel>
        <p className="text-sm text-muted-foreground">Coming soon.</p>
      </CardPanel>
    </Card>
  );
}
