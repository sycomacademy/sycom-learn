import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";

export const Route = createFileRoute("/dashboard/admin/catalog")({
  component: CatalogLayout,
});

function CatalogLayout() {
  return (
    <div className="mb-10 max-w-3xl md:ml-10">
      <SecondaryMenu
        base="/dashboard/admin/catalog"
        items={[
          { path: "/dashboard/admin/catalog", label: "Catalog" },
          { path: "/dashboard/admin/catalog/categories", label: "Categories" },
          { path: "/dashboard/admin/catalog/drafts", label: "Drafts" },
        ]}
        label="Catalog"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
