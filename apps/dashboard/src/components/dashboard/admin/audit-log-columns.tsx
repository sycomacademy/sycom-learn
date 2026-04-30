import { Avatar, AvatarFallback } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { formatDateTime } from "@sycom/ui/lib/date";
import { getInitials } from "@sycom/ui/lib/string";
import { createColumnHelper } from "@tanstack/react-table";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { formatEventLabel } from "./audit-log-helpers";

export type AuditLogRow = AppRouterOutputs["admin"]["listAuditLog"]["rows"][number];

function ActorCell({ row }: { row: AuditLogRow }) {
  if (row.actorType === "system" || !row.actorName) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="size-7 rounded-md">
          <AvatarFallback className="rounded-md text-[10px] font-medium text-muted-foreground">
            SY
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-muted-foreground">System</span>
      </div>
    );
  }

  return (
    <div className="flex max-w-72 min-w-0 items-center gap-3">
      <Avatar className="size-8 rounded-md">
        <AvatarFallback className="rounded-md text-xs font-medium text-muted-foreground">
          {getInitials(row.actorName).slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{row.actorName}</p>
        {row.actorEmail ? (
          <p className="truncate text-xs text-muted-foreground">{row.actorEmail}</p>
        ) : null}
      </div>
    </div>
  );
}

function EntityCell({ row }: { row: AuditLogRow }) {
  if (!row.entityType) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex max-w-56 min-w-0 flex-col">
      <span className="truncate text-sm">{row.entityType}</span>
      {row.entityId ? (
        <span className="truncate font-mono text-[10px] text-muted-foreground">{row.entityId}</span>
      ) : null}
    </div>
  );
}

const columnHelper = createColumnHelper<AuditLogRow>();

export const AUDIT_LOG_COLUMNS = [
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: "Time",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{formatDateTime(row.original.createdAt)}</span>
    ),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.accessor("actorName", {
    id: "actor",
    header: "Actor",
    cell: ({ row }) => <ActorCell row={row.original} />,
    enableSorting: false,
  }),
  columnHelper.accessor("event", {
    id: "event",
    header: "Event",
    cell: ({ row }) => (
      <Badge className="font-mono text-[10px]" variant="outline">
        {formatEventLabel(row.original.event)}
      </Badge>
    ),
    enableSorting: true,
  }),
  columnHelper.accessor("entityType", {
    id: "entity",
    header: "Entity",
    cell: ({ row }) => <EntityCell row={row.original} />,
    enableSorting: false,
  }),
  columnHelper.accessor("organizationName", {
    id: "organization",
    header: "Organization",
    cell: ({ row }) =>
      row.original.organizationName ?? <span className="text-xs text-muted-foreground">—</span>,
    enableSorting: false,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.accessor("ip", {
    id: "ip",
    header: "IP",
    cell: ({ row }) =>
      row.original.ip ? (
        <span className="font-mono text-xs text-muted-foreground">{row.original.ip}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    enableSorting: false,
  }),
];
