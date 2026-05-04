import { EyeIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@sycom/ui/components/sheet";
import { Button } from "@sycom/ui/components/button";
import { formatDateTime } from "@sycom/ui/lib/date";
import { Avatar, AvatarFallback } from "@sycom/ui/components/avatar";
import { getInitials } from "@sycom/ui/lib/string";
import { timeAgo, type AuditLogRow } from "./audit-log-schema";
import { JsonViewer } from "@sycom/ui/components/elements/json-viewer";

export type AuditLogDetailRow = AuditLogRow;

type DetailRowProps = { label: string; value: ReactNode };

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

type AuditLogDetailSheetProps = {
  row: AuditLogDetailRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function AuditLogSheetContent({ row }: { row: AuditLogDetailRow }): ReactNode {
  return (
    <>
      <SheetHeader>
        <div className="space-y-1 pe-8">
          <SheetTitle>{row.eventTitle}</SheetTitle>
          <SheetDescription>{row.eventSubtitle}</SheetDescription>
        </div>
      </SheetHeader>

      <SheetPanel>
        <dl>
          <DetailRow
            label="Time"
            value={
              <span className="flex items-baseline gap-2">
                <span>{timeAgo(row.createdAt)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(row.createdAt)}
                </span>
              </span>
            }
          />

          <DetailRow
            label="User"
            value={
              row.actorName ? (
                <div className="flex items-center gap-2">
                  <Avatar className="size-6 rounded-md">
                    <AvatarFallback className="rounded-md text-[9px] font-medium text-muted-foreground">
                      {getInitials(row.actorName).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{row.actorName}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">System</span>
              )
            }
          />

          <DetailRow
            label="IP Address"
            value={
              row.ip ? (
                <span className="font-mono">{row.ip}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />

          {row.organizationName ? (
            <DetailRow label="Organization" value={row.organizationName} />
          ) : null}
        </dl>

        {row.metadata && Object.keys(row.metadata).length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Event Data
            </p>
            <JsonViewer data={JSON.parse(JSON.stringify(row.metadata))} className="border p-2" />
          </div>
        ) : null}
      </SheetPanel>

      <SheetFooter variant="bare">
        <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
      </SheetFooter>
    </>
  );
}

export function AuditLogDetailSheet({
  row,
  open,
  onOpenChange,
}: AuditLogDetailSheetProps): ReactNode {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup>{row ? <AuditLogSheetContent row={row} /> : null}</SheetPopup>
    </Sheet>
  );
}

export function AuditLogActions({ row }: { row: AuditLogDetailRow }): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        render={
          <Button aria-label={`View event ${row.eventTitle}`} size="sm" variant="ghost">
            <EyeIcon className="size-4" />
          </Button>
        }
      />
      <SheetPopup variant="inset">
        <AuditLogSheetContent row={row} />
      </SheetPopup>
    </Sheet>
  );
}
