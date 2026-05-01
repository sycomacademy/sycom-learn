import { Badge } from "@sycom/ui/components/badge";
import { formatDateTime } from "@sycom/ui/lib/date";
import { createColumnHelper } from "@tanstack/react-table";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { ORG_INVITE_STATUS_CONFIG, ORG_ROLE_LABELS } from "./org-invites-helpers";

export type OrgInviteRow = AppRouterOutputs["admin"]["listOrganizationInvitations"]["rows"][number];

function OrganizationCell({ invite }: { invite: OrgInviteRow }) {
  return (
    <div className="flex max-w-72 min-w-0 flex-col">
      <span className="truncate font-medium text-foreground">{invite.organizationName}</span>
      <span className="truncate text-xs text-muted-foreground">{invite.organizationSlug}</span>
    </div>
  );
}

function InviteeCell({ invite }: { invite: OrgInviteRow }) {
  return (
    <div className="flex max-w-72 min-w-0 flex-col">
      <span className="truncate font-medium text-foreground">
        {invite.inviteeName ?? invite.email}
      </span>
      <span className="truncate text-xs text-muted-foreground">{invite.email}</span>
    </div>
  );
}

function InvitedByCell({ invite }: { invite: OrgInviteRow }) {
  return (
    <div className="flex max-w-72 min-w-0 flex-col">
      <span className="truncate font-medium text-foreground">{invite.inviterName}</span>
      <span className="truncate text-xs text-muted-foreground">{invite.inviterEmail}</span>
    </div>
  );
}

const columnHelper = createColumnHelper<OrgInviteRow>();

export const ORG_INVITES_COLUMNS = [
  columnHelper.accessor("organizationName", {
    id: "organizationName",
    header: "Organization",
    cell: ({ row }) => <OrganizationCell invite={row.original} />,
    enableSorting: true,
  }),
  columnHelper.accessor("email", {
    id: "email",
    header: "Invitee",
    cell: ({ row }) => <InviteeCell invite={row.original} />,
    enableSorting: true,
  }),
  columnHelper.accessor("role", {
    id: "role",
    header: "Role",
    cell: ({ row }) => (row.original.role ? ORG_ROLE_LABELS[row.original.role] : "—"),
    enableSorting: false,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = ORG_INVITE_STATUS_CONFIG[row.original.status];
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
    enableSorting: false,
  }),
  columnHelper.accessor("inviterName", {
    id: "inviterName",
    header: "Invited by",
    cell: ({ row }) => <InvitedByCell invite={row.original} />,
    enableSorting: false,
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: "Sent",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
];
