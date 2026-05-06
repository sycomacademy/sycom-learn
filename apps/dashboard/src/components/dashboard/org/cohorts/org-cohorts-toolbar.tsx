import { RefreshCcw, Search } from "lucide-react";
import type { ReactNode } from "react";

import { CreateOrgCohortDialog } from "@/components/dashboard/org/cohorts/create-org-cohort-dialog";
import { Button } from "@sycom/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Spinner } from "@sycom/ui/components/spinner";
import { cn } from "@sycom/ui/lib/utils";

export type OrgCohortsToolbarProps = {
  search: string;
  onSearchChange: (next: string) => void;
  isFetching?: boolean;
  onRefresh?: () => void;
};

export function OrgCohortsToolbar({
  search,
  onSearchChange,
  isFetching = false,
  onRefresh,
}: OrgCohortsToolbarProps): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor="org-cohorts-search">
          Search cohorts by name
        </label>
        <InputGroup className="w-full max-w-md">
          <InputGroupAddon align="inline-start">
            {isFetching ? <Spinner className="size-4" /> : <Search className="size-4 opacity-60" />}
          </InputGroupAddon>
          <InputGroupInput
            id="org-cohorts-search"
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            placeholder="Search cohorts..."
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

      <CreateOrgCohortDialog />
    </div>
  );
}
