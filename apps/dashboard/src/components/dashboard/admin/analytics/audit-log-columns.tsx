import { Avatar, AvatarFallback } from "@sycom/ui/components/avatar";
import { formatDateTime } from "@sycom/ui/lib/date";
import { getInitials } from "@sycom/ui/lib/string";
import { createColumnHelper } from "@tanstack/react-table";

import { AuditLogActions } from "./audit-log-detail-sheet";
import { timeAgo, type AuditLogRow } from "./audit-log-schema";

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

function EventCell({ row }: { row: AuditLogRow }) {
  return (
    <div className="flex max-w-80 min-w-0 flex-col gap-0.5">
      <span className="truncate text-sm font-medium text-foreground">{row.eventTitle}</span>
      <span className="truncate text-xs text-muted-foreground">{row.eventSubtitle}</span>
    </div>
  );
}

function ByCell({ row }: { row: AuditLogRow }) {
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
    <div className="flex max-w-56 min-w-0 items-center gap-3">
      <Avatar className="size-8 rounded-md">
        <AvatarFallback className="rounded-md text-xs font-medium text-muted-foreground">
          {getInitials(row.actorName).slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-sm font-medium text-foreground">{row.actorName}</span>
    </div>
  );
}

function LocationCell({ row }: { row: AuditLogRow }) {
  if (!row.ip) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="font-mono text-xs text-foreground">{row.ip}</span>
    </div>
  );
}

function TimeCell({ row }: { row: AuditLogRow }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm text-foreground">{timeAgo(row.createdAt)}</span>
      <span className="font-mono text-xs text-muted-foreground">
        {formatDateTime(row.createdAt)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<AuditLogRow>();

export const AUDIT_LOG_COLUMNS = [
  columnHelper.accessor("eventTitle", {
    id: "event",
    header: "Event",
    cell: ({ row }) => <EventCell row={row.original} />,
    enableSorting: true,
  }),
  columnHelper.accessor("actorName", {
    id: "actorType",
    header: "By",
    cell: ({ row }) => <ByCell row={row.original} />,
    enableSorting: false,
  }),
  columnHelper.accessor("ip", {
    id: "location",
    header: "Location",
    cell: ({ row }) => <LocationCell row={row.original} />,
    enableSorting: false,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: "Time",
    cell: ({ row }) => <TimeCell row={row.original} />,
    enableSorting: true,
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <AuditLogActions row={row.original} />,
    meta: { className: "w-12 text-right" },
  }),
];
