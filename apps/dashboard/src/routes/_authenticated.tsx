import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import Header from "@/components/header";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
    return { session: context.session };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="grid h-svh grid-rows-[auto_1fr]">
      <Header />
      <Outlet />
    </div>
  );
}
