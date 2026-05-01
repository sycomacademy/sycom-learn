import { RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@sycom/ui/components/button";
import { cn } from "@sycom/ui/lib/utils";

export type ReportsToolbarProps = {
  isFetching?: boolean;
  onRefresh?: () => void;
};

export function ReportsToolbar({ isFetching = false, onRefresh }: ReportsToolbarProps): ReactNode {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        aria-label="Refresh"
        disabled={isFetching}
        onClick={onRefresh}
        size="icon"
        variant="outline"
      >
        <RefreshCcw className={cn(isFetching ? "animate-spin" : "", "size-4")} />
      </Button>
    </div>
  );
}
