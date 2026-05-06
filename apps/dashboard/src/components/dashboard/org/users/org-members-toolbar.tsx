import { Button } from "@sycom/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Spinner } from "@sycom/ui/components/spinner";
import { cn } from "@sycom/ui/lib/utils";
import { RefreshCcw, Search } from "lucide-react";
import type { ReactNode } from "react";

import { InviteOrgMemberDialog } from "@/components/dashboard/org/users/invite-org-member-dialog";
export type OrgMembersToolbarProps = {
  search: string;
  onSearchChange: (next: string) => void;
  isFetching?: boolean;
  onRefresh?: () => void;
};

export function OrgMembersToolbar({
  isFetching = false,
  onRefresh,
  onSearchChange,
  search,
}: OrgMembersToolbarProps): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor="org-members-search">
          Search by name or email
        </label>
        <InputGroup className="w-full max-w-md">
          <InputGroupAddon align="inline-start">
            {isFetching ? <Spinner className="size-4" /> : <Search className="size-4 opacity-60" />}
          </InputGroupAddon>
          <InputGroupInput
            id="org-members-search"
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            placeholder="Search by name or email…"
            type="search"
            value={search}
          />
        </InputGroup>
      </div>

      <Button
        aria-label="Refresh"
        disabled={isFetching}
        onClick={onRefresh}
        size="icon"
        variant="outline"
      >
        <RefreshCcw className={cn(isFetching ? "animate-spin" : "", "size-4")} />
      </Button>

      <InviteOrgMemberDialog />
    </div>
  );
}
