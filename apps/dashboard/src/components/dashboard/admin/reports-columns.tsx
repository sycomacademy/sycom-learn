import { Badge } from "@sycom/ui/components/badge";
import { formatDateTime } from "@sycom/ui/lib/date";
import { createColumnHelper } from "@tanstack/react-table";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { REPORT_STATUS_CONFIG, REPORT_TYPE_LABELS } from "./reports-helpers";
import { ReportsActions } from "./reports-actions";

export type ReportRow = AppRouterOutputs["admin"]["listReports"]["rows"][number];

function SubjectCell({ report }: { report: ReportRow }) {
  return (
    <div className="flex max-w-80 min-w-0 flex-col gap-1">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{report.subject}</p>
        <p className="truncate text-xs text-muted-foreground">{report.name ?? report.email}</p>
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">{report.description}</p>
    </div>
  );
}

const columnHelper = createColumnHelper<ReportRow>();

export const REPORTS_COLUMNS = [
  columnHelper.accessor("subject", {
    id: "subject",
    header: "Report",
    cell: ({ row }) => <SubjectCell report={row.original} />,
    enableSorting: false,
  }),
  columnHelper.accessor("type", {
    id: "type",
    header: "Type",
    cell: ({ row }) => REPORT_TYPE_LABELS[row.original.type],
    enableSorting: false,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = REPORT_STATUS_CONFIG[row.original.status];
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
    enableSorting: false,
  }),
  columnHelper.accessor("imageUrl", {
    id: "attachment",
    header: "Attachment",
    cell: ({ row }) => (
      <Badge variant={row.original.imageUrl ? "secondary" : "outline"}>
        {row.original.imageUrl ? "Included" : "None"}
      </Badge>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("createdAt", {
    id: "submittedAt",
    header: "Submitted",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <ReportsActions report={row.original} />,
    meta: { headerClassName: "w-10", className: "w-10 pe-2 text-end" },
  }),
];
