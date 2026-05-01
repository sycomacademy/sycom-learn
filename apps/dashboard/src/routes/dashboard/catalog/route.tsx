import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";

export const Route = createFileRoute("/dashboard/catalog")({
  component: CatalogLayout,
});

function CatalogLayout() {
  return (
    <div className="mb-10 max-w-6xl md:ml-10">
      <SecondaryMenu
        base="/dashboard/catalog"
        items={[
          { path: "/dashboard/catalog", label: "Catalog" },
          { path: "/dashboard/catalog/categories", label: "Categories" },
        ]}
        label="Catalog"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
