import { formatDateTime } from "@sycom/ui/lib/date";
import { createColumnHelper } from "@tanstack/react-table";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

export type FeedbackRow = AppRouterOutputs["feedback"]["listFeedback"]["rows"][number];

const columnHelper = createColumnHelper<FeedbackRow>();

export const FEEDBACK_COLUMNS = [
  columnHelper.accessor("email", {
    id: "email",
    header: "Email",
    cell: ({ row }) => (
      <p className="max-w-72 truncate font-medium text-foreground">{row.original.email}</p>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("message", {
    id: "message",
    header: "Message",
    cell: ({ row }) => (
      <p className="line-clamp-2 max-w-xl text-sm text-muted-foreground">{row.original.message}</p>
    ),
    enableSorting: false,
    meta: { className: "w-full max-w-xl" },
  }),
  columnHelper.accessor("createdAt", {
    id: "submittedAt",
    header: "Submitted",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
    enableSorting: true,
    meta: {
      headerClassName: "w-[12.5rem] whitespace-nowrap",
      className: "w-[12.5rem] whitespace-nowrap text-muted-foreground",
    },
  }),
];
