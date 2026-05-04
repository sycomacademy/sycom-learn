import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/catalog")({
  component: CatalogSectionLayout,
});

function CatalogSectionLayout() {
  return <Outlet />;
}
