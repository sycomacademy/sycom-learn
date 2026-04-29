import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MailIcon, PlusIcon, RefreshCcwIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { PublicInviteDialog } from "@/components/dashboard/admin/invite-user-dialog";
import { ROLE_LABELS } from "@/components/dashboard/admin/users-helpers";
import { useTRPC } from "@/lib/trpc/client";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sycom/ui/components/table";
import { toastManager } from "@sycom/ui/components/toast";

const STATUS_CONFIG = {
  accepted: { label: "Accepted", variant: "success" },
  expired: { label: "Expired", variant: "secondary" },
  pending: { label: "Pending", variant: "warning" },
  rejected: { label: "Declined", variant: "secondary" },
  revoked: { label: "Revoked", variant: "outline" },
} as const;

export const Route = createFileRoute("/dashboard/admin/users/public-invites")({
  loader: async ({ context }) => {
    await context.queryClient.fetchQuery(
      context.trpc.admin.listPlatformInvitations.queryOptions({}),
    );
  },
  component: AdminUsersPublicInvitesPage,
});

function AdminUsersPublicInvitesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const query = useQuery(trpc.admin.listPlatformInvitations.queryOptions({}));
  const listInvitesQueryKey = trpc.admin.listPlatformInvitations.queryKey({});

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

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-medium">Public invites</h1>
          <p className="text-sm text-muted-foreground">
            Track platform invitations before the user accepts and becomes a real account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            disabled={query.isFetching}
            onClick={() => query.refetch()}
            size="icon"
            variant="outline"
          >
            <RefreshCcwIcon className={query.isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
          <Button onClick={() => setInviteOpen(true)}>
            <PlusIcon className="size-4" />
            New invite
          </Button>
        </div>
      </div>

      <PublicInviteDialog onOpenChange={setInviteOpen} open={inviteOpen} />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invitee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited by</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data && query.data.length > 0 ? (
              query.data.map((invite) => {
                const status = STATUS_CONFIG[invite.status];
                const canResend = invite.status === "pending" || invite.status === "expired";
                const canRevoke = invite.status === "pending" || invite.status === "expired";

                return (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{invite.name}</span>
                        <span className="text-sm text-muted-foreground">{invite.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{ROLE_LABELS[invite.role]}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{invite.inviterName}</TableCell>
                    <TableCell>{new Date(invite.expiresAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {canResend ? (
                          <Button
                            disabled={revokeMutation.isPending}
                            loading={
                              resendMutation.isPending &&
                              resendMutation.variables?.invitationId === invite.id
                            }
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
                            loading={
                              revokeMutation.isPending &&
                              revokeMutation.variables?.invitationId === invite.id
                            }
                            onClick={() => revokeMutation.mutate({ invitationId: invite.id })}
                            size="sm"
                            variant="outline"
                          >
                            <XIcon className="size-4" />
                            Revoke
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={6}>
                  No public invites yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
