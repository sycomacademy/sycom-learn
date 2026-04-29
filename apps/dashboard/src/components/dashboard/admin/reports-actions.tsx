import { CheckCheckIcon, CircleDashedIcon, EyeIcon, LinkIcon, XCircleIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { Button } from "@sycom/ui/components/button";
import { Badge } from "@sycom/ui/components/badge";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@sycom/ui/components/sheet";
import { formatDateTime } from "@sycom/ui/lib/date";

import { REPORT_STATUS_CONFIG, REPORT_TYPE_LABELS } from "./reports-helpers";

type ReportRow = AppRouterOutputs["admin"]["listReports"]["rows"][number];

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function ReportsActions({ report }: { report: ReportRow }): ReactNode {
  const status = REPORT_STATUS_CONFIG[report.status];

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button aria-label={`View report ${report.subject}`} size="sm" variant="outline">
            <EyeIcon className="size-4" />
            View
          </Button>
        }
      />
      <SheetPopup>
        <SheetHeader>
          <div className="space-y-3 pe-8">
            <div>
              <SheetTitle>{report.subject}</SheetTitle>
              <SheetDescription>{report.name ?? report.email}</SheetDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="outline">{REPORT_TYPE_LABELS[report.type]}</Badge>
              <Badge variant={report.userId ? "success" : "secondary"}>
                {report.userId ? "Signed in" : "Guest"}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <SheetPanel>
          <dl>
            <DetailRow label="Submitted" value={formatDateTime(report.createdAt)} />
            <DetailRow label="Updated" value={formatDateTime(report.updatedAt)} />
            <DetailRow label="Email" value={report.email} />
            <DetailRow
              label="Attachment"
              value={
                report.imageUrl ? (
                  <a
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                    href={report.imageUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <LinkIcon className="size-4" />
                    Open attachment
                  </a>
                ) : (
                  "None"
                )
              }
            />
            <DetailRow
              label="Full feedback"
              value={
                <p className="leading-6 whitespace-pre-wrap text-foreground">
                  {report.description}
                </p>
              }
            />
          </dl>
        </SheetPanel>

        <SheetFooter>
          <Button disabled variant="outline">
            <CheckCheckIcon className="size-4" />
            Mark completed
          </Button>
          <Button disabled variant="outline">
            <CircleDashedIcon className="size-4" />
            Mark in progress
          </Button>
          <Button disabled variant="outline">
            <XCircleIcon className="size-4" />
            Mark ignored
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
