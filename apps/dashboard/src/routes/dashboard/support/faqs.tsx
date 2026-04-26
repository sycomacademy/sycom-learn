import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/support/faqs")({
  component: FaqsPage,
});

function FaqsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">FAQs</CardTitle>
        <CardDescription className="text-sm">Placeholder content for the FAQs tab.</CardDescription>
      </CardHeader>
    </Card>
  );
}
