import {
  CheckCheckIcon,
  CircleDashedIcon,
  EyeIcon,
  MoreHorizontalIcon,
  XCircleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { Button } from "@sycom/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";

import { REPORT_STATUS_LABELS } from "./reports-helpers";

type ReportRow = AppRouterOutputs["admin"]["listReports"]["rows"][number];

export function ReportsActions({ report }: { report: ReportRow }): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label={`Open actions for ${report.subject}`} size="icon-sm" variant="ghost">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="min-w-0">
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">{report.subject}</span>
              <span className="truncate text-xs text-muted-foreground">
                {REPORT_STATUS_LABELS[report.status]}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <EyeIcon />
            View report
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <CircleDashedIcon />
            Move to in progress
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <CheckCheckIcon />
            Mark resolved
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <XCircleIcon />
            Close report
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
