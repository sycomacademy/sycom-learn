import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";

export const Route = createFileRoute("/dashboard/support")({
  component: SupportLayout,
});

function SupportLayout() {
  return (
    <div className="mb-10 max-w-3xl md:ml-10">
      <SecondaryMenu
        base="/dashboard/support/report-issue"
        items={[
          { path: "/dashboard/support/report-issue", label: "Report" },
          { path: "/dashboard/support/faqs", label: "FAQ" },
          { path: "/dashboard/support/contact", label: "Contact Us" },
        ]}
        label="Support"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
