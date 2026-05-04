import { Outlet, createFileRoute } from "@tanstack/react-router";

import { FadeIn } from "@/components/layout/motion-fade";

export const Route = createFileRoute("/dashboard/catalog")({
  component: CatalogSectionLayout,
});

function CatalogSectionLayout() {
  return (
    <FadeIn className="flex flex-col" motionKey="catalog-section">
      <Outlet />
    </FadeIn>
  );
}
