import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/support/contact")({
  component: ContactPage,
});

function ContactPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Contact</CardTitle>
        <CardDescription className="text-sm">
          Placeholder content for the contact tab.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
