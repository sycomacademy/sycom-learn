import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/catalog/drafts")({
  component: CatalogDraftsPage,
});

function CatalogDraftsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Drafts</CardTitle>
        <CardDescription className="text-sm">
          In-progress courses that haven&apos;t been published to the catalog yet. Review and
          publish flows are coming soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
