import { Badge } from "@sycom/ui/components/badge";
import { formatDateTime } from "@sycom/ui/lib/date";
import { createColumnHelper } from "@tanstack/react-table";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { PublicInviteActions } from "./public-invite-actions";
import { PLATFORM_INVITE_STATUS_CONFIG } from "./public-invites-helpers";
import { ROLE_LABELS } from "./users-schema";

export type PublicInviteRow = AppRouterOutputs["admin"]["listPlatformInvitations"]["rows"][number];

function InviteeCell({ invite }: { invite: PublicInviteRow }) {
  return (
    <div className="flex max-w-72 min-w-0 flex-col">
      <span className="truncate font-medium text-foreground">{invite.name}</span>
      <span className="truncate text-xs text-muted-foreground">{invite.email}</span>
    </div>
  );
}

const columnHelper = createColumnHelper<PublicInviteRow>();

export const PUBLIC_INVITES_COLUMNS = [
  columnHelper.accessor("name", {
    id: "name",
    header: "Invitee",
    cell: ({ row }) => <InviteeCell invite={row.original} />,
    enableSorting: true,
  }),
  columnHelper.accessor("role", {
    id: "role",
    header: "Role",
    cell: ({ row }) => ROLE_LABELS[row.original.role],
    enableSorting: false,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = PLATFORM_INVITE_STATUS_CONFIG[row.original.status];
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
    enableSorting: false,
  }),
  columnHelper.accessor("inviterName", {
    id: "inviterName",
    header: "Invited by",
    cell: ({ row }) => row.original.inviterName,
    enableSorting: false,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: "Sent",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.accessor("expiresAt", {
    id: "expiresAt",
    header: "Expires",
    cell: ({ row }) => formatDateTime(row.original.expiresAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <PublicInviteActions invite={row.original} />,
    meta: { headerClassName: "w-48", className: "w-48 pe-2 text-end" },
  }),
];
