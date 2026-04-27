import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/admin/catalog/categories")({
  component: CatalogCategoriesPage,
});

function CatalogCategoriesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Categories</CardTitle>
        <CardDescription className="text-sm">
          Course taxonomy used to organize the catalog and power discovery. Tag editing and
          reordering are coming soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
