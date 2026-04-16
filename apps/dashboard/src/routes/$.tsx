import { createFileRoute, redirect } from "@tanstack/react-router";

import NotFound from "@/components/layout/not-found";

export const Route = createFileRoute("/$")({
  beforeLoad: ({ context, location }) => {
    if (!context.session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
  },
  head: () => ({
    meta: [{ title: "Not found | Sycom" }],
  }),
  component: NotFound,
});
