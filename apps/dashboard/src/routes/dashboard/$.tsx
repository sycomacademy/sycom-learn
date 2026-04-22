import { createFileRoute } from "@tanstack/react-router";
import NotFound from "@/components/layout/not-found";

export const Route = createFileRoute("/dashboard/$")({
  head: () => ({
    meta: [{ title: "Not found | Sycom" }],
  }),
  component: NotFound,
});
