import { Button } from "@sycom/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Spinner } from "@sycom/ui/components/spinner";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@sycom/ui/components/tooltip";
import { PlusIcon, RefreshCwIcon, SearchIcon } from "lucide-react";

import { FilterMultiCombobox, type FilterMultiComboboxItem } from "./filter-multi-combobox";

interface UsersTableToolbarProps {
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  roleOptions: readonly FilterMultiComboboxItem[];
  statusOptions: readonly FilterMultiComboboxItem[];
  selectedRoles: string[];
  selectedStatuses: string[];
  onRolesChange: (value: string[]) => void;
  onStatusesChange: (value: string[]) => void;
  onRefresh: () => void;
  isFetching: boolean;
  isRefetching: boolean;
}

export function UsersTableToolbar({
  searchValue,
  onSearchValueChange,
  roleOptions,
  statusOptions,
  selectedRoles,
  selectedStatuses,
  onRolesChange,
  onStatusesChange,
  onRefresh,
  isFetching,
  isRefetching,
}: UsersTableToolbarProps) {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full max-w-xl">
          <label className="sr-only" htmlFor="users-search">
            Search users by name or email
          </label>
          <InputGroup className="w-full rounded-none bg-background shadow-none">
            <InputGroupAddon align="inline-start">
              <SearchIcon className="size-5 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="users-search"
              onChange={(event) => {
                onSearchValueChange(event.target.value);
              }}
              placeholder="Search by name or email..."
              type="search"
              value={searchValue}
            />
            {isFetching ? (
              <InputGroupAddon align="inline-end">
                <Spinner className="size-4 text-muted-foreground" />
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Refresh users"
                  loading={isRefetching}
                  onClick={onRefresh}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <RefreshCwIcon className="size-4" />
                </Button>
              }
            />
            <TooltipPopup>Refresh users</TooltipPopup>
          </Tooltip>

          <Button disabled type="button">
            <PlusIcon className="size-4" />
            New invite
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterMultiCombobox
          allLabel="All roles"
          emptyMessage="No roles found."
          filterLabel="Role"
          items={roleOptions}
          onChange={onRolesChange}
          searchPlaceholder="Search role..."
          value={selectedRoles}
        />
        <FilterMultiCombobox
          allLabel="All statuses"
          emptyMessage="No statuses found."
          filterLabel="Status"
          items={statusOptions}
          onChange={onStatusesChange}
          searchPlaceholder="Search status..."
          value={selectedStatuses}
        />
      </div>
    </>
  );
}
