import { Building2Icon, CopyIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import type { ReactNode } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { Button } from "@sycom/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";
import { toastManager } from "@sycom/ui/components/toast";

type OrganizationRow = AppRouterOutputs["admin"]["listOrganizations"]["rows"][number];

export function OrganizationActions({
  organization,
}: {
  organization: OrganizationRow;
}): ReactNode {
  async function handleCopySlug() {
    try {
      await navigator.clipboard.writeText(organization.slug);
      toastManager.add({
        title: "Slug copied",
        description: `${organization.slug} copied to your clipboard.`,
        type: "success",
      });
    } catch {
      toastManager.add({
        title: "Could not copy slug",
        description: "Try copying it manually from the table.",
        type: "error",
      });
    }
  }

  function showPlaceholder(title: string) {
    toastManager.add({
      title,
      description: "This organization workflow is not wired up yet.",
      type: "info",
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={`Open actions for ${organization.name}`}
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="min-w-0">
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {organization.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">{organization.slug}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => void handleCopySlug()}>
            <CopyIcon />
            Copy org slug
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => showPlaceholder("View org coming soon")}>
            <Building2Icon />
            View org
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => showPlaceholder("Delete org coming soon")}
          variant="destructive"
        >
          <Trash2Icon />
          Delete org
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
