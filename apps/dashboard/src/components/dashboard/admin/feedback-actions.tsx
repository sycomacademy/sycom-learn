import { EyeIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { Button } from "@sycom/ui/components/button";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@sycom/ui/components/sheet";
import { formatDateTime } from "@sycom/ui/lib/date";

type FeedbackRow = AppRouterOutputs["feedback"]["listFeedback"]["rows"][number];

export function FeedbackActions({ feedback }: { feedback: FeedbackRow }): ReactNode {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button aria-label={`View feedback from ${feedback.email}`} size="sm" variant="outline">
            <EyeIcon className="size-4" />
            View
          </Button>
        }
      />
      <SheetPopup>
        <SheetHeader>
          <SheetTitle>Feedback details</SheetTitle>
          <SheetDescription>Submitted by {feedback.email}</SheetDescription>
        </SheetHeader>
        <SheetPanel className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Submitted {formatDateTime(feedback.createdAt)}
          </p>
          <p className="text-sm leading-6 whitespace-pre-wrap text-foreground">
            {feedback.message}
          </p>
        </SheetPanel>
      </SheetPopup>
    </Sheet>
  );
}
