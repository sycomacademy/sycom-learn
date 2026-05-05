"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { BuildingIcon } from "@sycom/ui/components/animated/icons/building";
import { AnimateIcon } from "@sycom/ui/components/animated/icons/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@sycom/ui/components/sidebar";
import { toastManager } from "@sycom/ui/components/toast";
import { cn } from "@sycom/ui/lib/utils";
import { ChevronsUpDown } from "lucide-react";

import { useUser } from "@/hooks/use-user";
import { authClient } from "@/lib/auth/auth-client";
import { SESSION_QUERY_KEY } from "@/lib/auth/session";
import { useTRPC } from "@/lib/trpc/client";

export function OrganizationSwitcher(): React.ReactElement | null {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    data: { session },
  } = useUser();

  const membershipsQuery = useQuery(trpc.organization.memberships.queryOptions());
  const memberships = membershipsQuery.data ?? [];

  const [pendingAction, setPendingAction] = React.useState<false | "leave" | { switchTo: string }>(
    false,
  );

  if (membershipsQuery.isPending || membershipsQuery.isError || memberships.length === 0) {
    return null;
  }

  const activeOrganizationId = session.activeOrganizationId ?? null;

  const activeMembership = activeOrganizationId
    ? memberships.find((m) => m.organizationId === activeOrganizationId)
    : undefined;

  const triggerLabel =
    activeMembership?.name?.trim() || activeMembership?.slug?.trim() || "Personal workspace";

  const refreshCaches = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
      queryClient.invalidateQueries(trpc.profile.get.queryOptions()),
      queryClient.invalidateQueries(trpc.onboarding.status.queryOptions()),
      queryClient.invalidateQueries(trpc.student.getDashboardOverview.queryOptions({})),
      queryClient.invalidateQueries(trpc.student.getLibrary.queryOptions({})),
      queryClient.invalidateQueries({ queryKey: trpc.catalog.list.queryKey() }),
    ]);
  };

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === activeOrganizationId) return;
    setPendingAction({ switchTo: organizationId });
    try {
      const { error } = await authClient.organization.setActive({ organizationId });
      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }
      await refreshCaches();
    } catch {
      toastManager.add({
        title: "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setPendingAction(false);
    }
  };

  const handleLeaveOrganization = async () => {
    if (!activeOrganizationId) {
      await router.navigate({ to: "/dashboard", replace: true });
      return;
    }
    setPendingAction("leave");
    try {
      const { error } = await authClient.organization.setActive({ organizationId: null });
      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }
      await refreshCaches();
      await router.navigate({ to: "/dashboard", replace: true });
    } catch {
      toastManager.add({
        title: "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setPendingAction(false);
    }
  };

  const isBusy = pendingAction !== false;

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  aria-label="Organization switcher"
                  className={cn(isBusy && "pointer-events-none opacity-70")}
                  disabled={isBusy}
                  size="lg"
                  tooltip={{ children: `Organization: ${triggerLabel}` }}
                >
                  <AnimateIcon animateOnHover className="shrink-0">
                    <BuildingIcon className="size-6" />
                  </AnimateIcon>
                  <span className="truncate group-data-[collapsible=icon]:opacity-0">
                    {triggerLabel}
                  </span>
                  <ChevronsUpDown
                    aria-hidden
                    className="ml-auto size-4 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden"
                  />
                </SidebarMenuButton>
              }
            />
            <DropdownMenuContent
              align="start"
              className="max-w-[min(24rem,calc(100vw-2rem))] min-w-48"
              side="top"
              sideOffset={6}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal">Organizations</DropdownMenuLabel>
                {memberships.map((org) => {
                  const selected = org.organizationId === activeOrganizationId;
                  return (
                    <DropdownMenuItem
                      aria-current={selected ? "true" : undefined}
                      className={cn(selected && "focus:bg-accent/80")}
                      disabled={selected || isBusy}
                      key={org.organizationId}
                      onClick={() => {
                        void handleSwitch(org.organizationId);
                      }}
                    >
                      <span className="truncate">
                        {org.name?.trim() ? org.name.trim() : org.slug}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
              {activeOrganizationId ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      disabled={isBusy}
                      onClick={() => {
                        void handleLeaveOrganization();
                      }}
                      variant="destructive"
                    >
                      Sign out of organization
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
