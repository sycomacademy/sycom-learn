import { Button } from "@sycom/ui/components/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Label } from "@sycom/ui/components/label";
import { Spinner } from "@sycom/ui/components/spinner";
import { Switch } from "@sycom/ui/components/switch";
import { Tabs, TabsList, TabsTab } from "@sycom/ui/components/tabs";
import { cn } from "@sycom/ui/lib/utils";
import { LayoutGridIcon, ListIcon, RefreshCcw, Search } from "lucide-react";
import type { ReactNode } from "react";

import type { CatalogViewMode } from "./catalog-schema";

export type CatalogToolbarProps = {
  search: string;
  onSearchChange: (next: string) => void;
  isFetching?: boolean;
  onRefresh?: () => void;
  view: CatalogViewMode;
  onViewChange: (next: CatalogViewMode) => void;
  enrolledOnly: boolean;
  onEnrolledOnlyChange: (next: boolean) => void;
};

export function CatalogToolbar({
  isFetching = false,
  onRefresh,
  onSearchChange,
  onViewChange,
  onEnrolledOnlyChange,
  search,
  view,
  enrolledOnly,
}: CatalogToolbarProps): ReactNode {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor="catalog-search">
          Search catalog by course title or slug
        </label>
        <InputGroup className="w-full max-w-md">
          <InputGroupAddon align="inline-start">
            {isFetching ? <Spinner className="size-4" /> : <Search className="size-4 opacity-60" />}
          </InputGroupAddon>
          <InputGroupInput
            id="catalog-search"
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            placeholder="Search by title or slug..."
            type="search"
            value={search}
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-3 sm:items-end">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={enrolledOnly}
              id="catalog-enrolled-only"
              onCheckedChange={onEnrolledOnlyChange}
            />
            <Label className="cursor-pointer text-sm" htmlFor="catalog-enrolled-only">
              Enrolled only
            </Label>
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        <Tabs onValueChange={(next) => onViewChange(next as CatalogViewMode)} value={view}>
          <TabsList className="grid w-full grid-cols-2 sm:w-auto" variant="default">
            <TabsTab className="gap-2" value="cards">
              <LayoutGridIcon className="size-4" />
              Cards
            </TabsTab>
            <TabsTab className="gap-2" value="list">
              <ListIcon className="size-4" />
              List
            </TabsTab>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
