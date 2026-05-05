import { createFileRoute } from "@tanstack/react-router";

import { ContactPage } from "@/routes/dashboard/support/contact";

export const Route = createFileRoute("/dashboard/org/support/contact")({
  component: ContactPage,
});
