import { createFileRoute } from "@tanstack/react-router";

import { FaqsPage } from "@/routes/dashboard/support/faqs";

export const Route = createFileRoute("/dashboard/org/support/faqs")({
  component: FaqsPage,
});
