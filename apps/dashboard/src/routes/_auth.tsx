import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AuthLeftPanel } from "@/components/auth/left-panel";
import { getUser } from "@/functions/get-user";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const session = await getUser();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }
    if (session) {
      void navigate({ replace: true, to: "/dashboard" });
    }
  }, [session, isPending, navigate]);

  return (
    <div className="flex min-h-svh bg-background p-1">
      <div className="relative hidden overflow-hidden bg-foreground lg:flex lg:w-1/2">
        <AuthLeftPanel />
      </div>

      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 lg:p-12">
        <div className="flex h-full w-full max-w-md flex-col">
          <div className="mb-8 flex items-center lg:hidden">
            <Link className="flex items-center gap-2" to="/">
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
