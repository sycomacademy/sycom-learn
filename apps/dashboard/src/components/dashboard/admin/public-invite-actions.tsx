import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MailIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import { toastManager } from "@sycom/ui/components/toast";

type PublicInviteRow = AppRouterOutputs["admin"]["listPlatformInvitations"]["rows"][number];

export function PublicInviteActions({ invite }: { invite: PublicInviteRow }): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listInvitesQueryKey = trpc.admin.listPlatformInvitations.queryKey();

  const resendMutation = useMutation({
    ...trpc.admin.resendPlatformInvitation.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "Invite resent",
          description: "A fresh invite email has been sent.",
          type: "success",
        });
        await queryClient.invalidateQueries({ queryKey: listInvitesQueryKey });
      },
      onError: (error) => {
        toastManager.add({
          title: "Could not resend invite",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const revokeMutation = useMutation({
    ...trpc.admin.revokePlatformInvitation.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "Invite revoked",
          description: "This invite can no longer be accepted.",
          type: "success",
        });
        await queryClient.invalidateQueries({ queryKey: listInvitesQueryKey });
      },
      onError: (error) => {
        toastManager.add({
          title: "Could not revoke invite",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const canResend = invite.status === "pending" || invite.status === "expired";
  const canRevoke = invite.status === "pending" || invite.status === "expired";

  if (!canResend && !canRevoke) {
    return <span className="text-xs text-muted-foreground">No actions</span>;
  }

  return (
    <div className="flex justify-end gap-2">
      {canResend ? (
        <Button
          disabled={revokeMutation.isPending}
          loading={resendMutation.isPending && resendMutation.variables?.invitationId === invite.id}
          onClick={() => resendMutation.mutate({ invitationId: invite.id })}
          size="sm"
          variant="outline"
        >
          <MailIcon className="size-4" />
          Resend
        </Button>
      ) : null}
      {canRevoke ? (
        <Button
          disabled={resendMutation.isPending}
          loading={revokeMutation.isPending && revokeMutation.variables?.invitationId === invite.id}
          onClick={() => revokeMutation.mutate({ invitationId: invite.id })}
          size="sm"
          variant="outline"
        >
          <XIcon className="size-4" />
          Revoke
        </Button>
      ) : null}
    </div>
  );
}
