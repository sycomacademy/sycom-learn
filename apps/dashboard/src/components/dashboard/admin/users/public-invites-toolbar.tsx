import { Plus, RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@sycom/ui/components/button";
import { cn } from "@sycom/ui/lib/utils";

export type PublicInvitesToolbarProps = {
  isFetching?: boolean;
  onRefresh?: () => void;
  onNewInvite?: () => void;
};

export function PublicInvitesToolbar({
  isFetching = false,
  onNewInvite,
  onRefresh,
}: PublicInvitesToolbarProps): ReactNode {
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

      <Button onClick={onNewInvite}>
        <Plus className="size-4" />
        New invite
      </Button>
    </div>
  );
}
