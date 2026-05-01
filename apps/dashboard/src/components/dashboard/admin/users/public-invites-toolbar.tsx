import { RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";

import { InviteUserDialog } from "@/components/dashboard/admin/users/invite-user-dialog";
import { Button } from "@sycom/ui/components/button";
import { cn } from "@sycom/ui/lib/utils";

export type PublicInvitesToolbarProps = {
  isFetching?: boolean;
  onRefresh?: () => void;
};

export function PublicInvitesToolbar({
  isFetching = false,
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
        <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
      </Button>

      <InviteUserDialog />
    </div>
  );
}
