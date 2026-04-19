import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { AuthLeftPanel } from "@/components/auth/left-panel";
import { Link } from "@/components/foresight-link";
import { safeRedirectPath } from "@/lib/post-auth-redirect";

const authSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/_auth")({
  validateSearch: authSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.session) {
      const safe = safeRedirectPath(search.redirect);
      if (safe) throw redirect({ href: safe });
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
            <Link className="flex items-center gap-2" to="/sign-in">
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
