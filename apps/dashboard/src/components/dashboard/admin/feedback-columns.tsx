import { Badge } from "@sycom/ui/components/badge";
import { formatDateTime } from "@sycom/ui/lib/date";
import { createColumnHelper } from "@tanstack/react-table";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { FeedbackActions } from "./feedback-actions";

export type FeedbackRow = AppRouterOutputs["admin"]["listFeedback"]["rows"][number];

function SubmitterCell({ feedback }: { feedback: FeedbackRow }) {
  return (
    <div className="flex max-w-72 min-w-0 flex-col gap-1">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{feedback.name ?? feedback.email}</p>
        {feedback.name ? (
          <p className="truncate text-xs text-muted-foreground">{feedback.email}</p>
        ) : null}
      </div>
      <div>
        <Badge variant={feedback.userId ? "success" : "secondary"}>
          {feedback.userId ? "Signed in" : "Guest"}
        </Badge>
      </div>
    </div>
  );
}

const columnHelper = createColumnHelper<FeedbackRow>();

export const FEEDBACK_COLUMNS = [
  columnHelper.accessor("email", {
    id: "submitter",
    header: "Submitter",
    cell: ({ row }) => <SubmitterCell feedback={row.original} />,
    enableSorting: false,
  }),
  columnHelper.accessor("message", {
    id: "message",
    header: "Message",
    cell: ({ row }) => (
      <p className="line-clamp-2 max-w-xl text-sm text-muted-foreground">{row.original.message}</p>
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
    cell: ({ row }) => <FeedbackActions feedback={row.original} />,
    meta: { headerClassName: "w-10", className: "w-10 pe-2 text-end" },
  }),
];
