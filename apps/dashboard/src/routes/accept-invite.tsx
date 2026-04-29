import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod/mini";

import { PublicInviteForm } from "@/components/auth/public-invite-form";
import { AuthLeftPanel } from "@/components/auth/left-panel";
import { Link } from "@/components/layout/foresight-link";
import { buttonVariants } from "@sycom/ui/components/button-variants";
import { BRAND, Image } from "@sycom/ui/image";

const acceptInviteSearchSchema = z.object({
  token: z.optional(z.string()),
});

export const Route = createFileRoute("/accept-invite")({
  validateSearch: acceptInviteSearchSchema,
  head: () => ({
    meta: [
      { title: "Accept invite | Sycom LMS" },
      {
        name: "description",
        content: "Accept your Sycom LMS platform invite.",
      },
    ],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = Route.useSearch();

  return (
    <div className="flex min-h-svh bg-background p-1">
      <div className="relative hidden overflow-hidden bg-foreground lg:flex lg:w-1/2">
        <AuthLeftPanel />
      </div>

      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 lg:p-12">
        <div className="flex h-full w-full max-w-md flex-col">
          <div className="mb-8 flex items-center lg:hidden">
            <Link className="flex items-center gap-2" to="/sign-in">
              <div className="flex size-16 items-center justify-center rounded bg-primary">
                <Image
                  alt="Sycom Solutions logo"
                  className="rounded object-contain"
                  height={80}
                  src={BRAND.LOGO}
                  width={80}
                />
              </div>
            </Link>
          </div>

          <div className="flex h-full w-full items-center justify-center">
            {token ? (
              <PublicInviteForm token={token} />
            ) : (
              <div className="w-full space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-lg font-medium tracking-tight">Missing invite token</h1>
                  <p className="text-sm text-muted-foreground">
                    This invite link is incomplete. Ask an admin to send a new one.
                  </p>
                </div>
                <Link className={buttonVariants({ variant: "outline" })} to="/sign-in">
                  Back to sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
