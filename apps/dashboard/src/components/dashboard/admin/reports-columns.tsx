import { Badge } from "@sycom/ui/components/badge";
import { formatDateTime } from "@sycom/ui/lib/date";
import { createColumnHelper } from "@tanstack/react-table";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { REPORT_STATUS_CONFIG, REPORT_TYPE_LABELS } from "./reports-helpers";
import { ReportsActions } from "./reports-actions";

export type ReportRow = AppRouterOutputs["admin"]["listReports"]["rows"][number];

const columnHelper = createColumnHelper<ReportRow>();

export const REPORTS_COLUMNS = [
  columnHelper.accessor("subject", {
    id: "title",
    header: "Title",
    cell: ({ row }) => (
      <p className="max-w-80 truncate font-medium text-foreground">{row.original.subject}</p>
    ),
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
  columnHelper.accessor("createdAt", {
    id: "submittedAt",
    header: "Submitted",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
    enableSorting: true,
    meta: { className: "text-muted-foreground" },
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ReportsActions report={row.original} />,
    meta: { headerClassName: "w-28", className: "w-28 pe-2 text-end" },
  }),
];
