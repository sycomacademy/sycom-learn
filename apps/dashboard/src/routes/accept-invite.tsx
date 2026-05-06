import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import * as z from "zod/mini";

import { OrganizationMemberInviteForm } from "@/components/auth/organization-member-invite-form";
import { OrganizationOwnerInviteForm } from "@/components/auth/organization-owner-invite-form";
import { PublicInviteForm } from "@/components/auth/public-invite-form";
import { AuthLeftPanel } from "@/components/auth/left-panel";
import { Link } from "@/components/layout/foresight-link";
import { buttonVariants } from "@sycom/ui/components/button-variants";
import { BRAND, Image } from "@sycom/ui/image";

const acceptInviteSearchSchema = z.object({
  token: z.optional(z.string()),
  kind: z.optional(z.enum(["organization", "organization-member"])),
});

export const Route = createFileRoute("/accept-invite")({
  validateSearch: acceptInviteSearchSchema,
  head: () => ({
    meta: [
      { title: "Accept invite | Sycom LMS" },
      {
        name: "description",
        content: "Accept your Sycom LMS invitation or organization invitation.",
      },
    ],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token, kind } = Route.useSearch();

  let form: ReactNode;

  if (token && kind === "organization") {
    form = <OrganizationOwnerInviteForm token={token} />;
  } else if (token && kind === "organization-member") {
    form = <OrganizationMemberInviteForm token={token} />;
  } else if (token) {
    form = <PublicInviteForm token={token} />;
  } else {
    form = (
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
    );
  }

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

          <div className="flex h-full w-full items-center justify-center">{form}</div>
        </div>
      </div>
    </div>
  );
}
