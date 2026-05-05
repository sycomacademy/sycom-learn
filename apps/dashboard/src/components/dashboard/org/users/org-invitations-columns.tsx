import { Badge } from "@sycom/ui/components/badge";
import { formatDate } from "@sycom/ui/lib/date";
import { createColumnHelper } from "@tanstack/react-table";

import {
  ORG_INVITATION_ROLE_LABELS,
  ORG_INVITATION_STATUS_CONFIG,
  type OrgInvitationRow,
  type OrgInvitationStatus,
} from "./org-invitations-schema";

function RoleBadge({ role }: { role: OrgInvitationRow["role"] }) {
  if (!role) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge className="rounded-md px-2 py-0.5 font-normal" size="default" variant="outline">
      {ORG_INVITATION_ROLE_LABELS[role]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: OrgInvitationStatus }) {
  const cfg = ORG_INVITATION_STATUS_CONFIG[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function InviterCell({ row }: { row: OrgInvitationRow }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm text-foreground">{row.inviterName}</p>
      <p className="truncate text-xs text-muted-foreground">{row.inviterEmail}</p>
    </div>
  );
}

const columnHelper = createColumnHelper<OrgInvitationRow>();

export const ORG_INVITATION_COLUMNS = [
  columnHelper.accessor("email", {
    id: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{row.original.email}</p>
        {row.original.inviteeName ? (
          <p className="truncate text-xs text-muted-foreground">{row.original.inviteeName}</p>
        ) : null}
      </div>
    ),
    enableSorting: true,
  }),
  columnHelper.display({
    id: "role",
    header: "Role",
    cell: ({ row }) => <RoleBadge role={row.original.role} />,
  }),
  columnHelper.display({
    id: "inviter",
    header: "Invited by",
    cell: ({ row }) => <InviterCell row={row.original} />,
  }),
  columnHelper.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: "Sent",
    cell: ({ row }) => formatDate(row.original.createdAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "expiresAt",
    header: "Expires",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.expiresAt)}</span>
    ),
  }),
];
