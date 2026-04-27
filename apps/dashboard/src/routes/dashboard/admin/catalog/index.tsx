import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/catalog/")({
  component: CatalogAllPage,
});

function CatalogAllPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Catalog</CardTitle>
        <CardDescription className="text-sm">
          Every Sycom-owned course in the platform library. Authoring, publishing, and archiving
          tools are coming soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
