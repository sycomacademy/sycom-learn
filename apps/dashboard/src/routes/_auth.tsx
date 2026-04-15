import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AuthLeftPanel } from "@/components/auth/left-panel";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-svh bg-background p-1">
      <div className="relative hidden overflow-hidden bg-foreground lg:flex lg:w-1/2">
        <AuthLeftPanel />
      </div>

      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 lg:p-12">
        <div className="flex h-full w-full max-w-md flex-col">
          <div className="mb-8 flex items-center lg:hidden">
            <Link className="flex items-center gap-2" to="/login">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary">
                <img
                  alt="Sycom Solutions logo"
                  className="size-8 object-contain"
                  height={32}
                  src="/sycom-logo.png"
                  width={32}
                />
              </div>
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
