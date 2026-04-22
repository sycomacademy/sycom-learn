"use client";

import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import { BlocksIcon } from "lucide-react";
import { LayoutDashboardIcon } from "@sycom/ui/components/animated/icons/layout-dashboard";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@sycom/ui/components/sidebar";
import { Link } from "@/components/layout/foresight-link";
import type { TRoutes } from "@/router";
import { cn } from "@sycom/ui/lib/utils";

type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: TRoutes;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboardIcon, label: "Overview", to: "/dashboard" },
      { icon: BlocksIcon, label: "Settings", to: "/dashboard/settings" },
    ],
  },
];

/** Cancel primitive icon-mode size/padding so the row keeps h-8 + p-2; width follows the narrowing rail. */
const menuButtonStableClass = cn(
  "group-data-[collapsible=icon]:!h-8",
  "group-data-[collapsible=icon]:!w-full",
  "group-data-[collapsible=icon]:!p-2",
  "group-data-[collapsible=icon]:justify-start",
);

const menuButtonLabelFadeClass = "group-data-[collapsible=icon]:[&>span:last-child]:opacity-0";

/** Cancel -mt-8 slide; keep label row height so nav items do not jump vertically. */
const groupLabelStableClass = cn(
  "group-data-[collapsible=icon]:!mt-0",
  "group-data-[collapsible=icon]:opacity-0",
  "group-data-[collapsible=icon]:pointer-events-none",
);

export function AppSidebar(): React.ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const activeTo = React.useMemo(() => {
    let bestMatch: TRoutes | undefined;
    let bestLength = -1;
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        const matches = pathname === item.to || pathname.startsWith(`${item.to}/`);
        if (matches && item.to.length > bestLength) {
          bestMatch = item.to;
          bestLength = item.to.length;
        }
      }
    }
    return bestMatch;
  }, [pathname]);

  return (
    <Sidebar className="border-sidebar-border" collapsible="icon" variant="inset">
      <SidebarHeader>
        <Link
          className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground"
          href="/dashboard"
        >
          <img
            alt="Sycom Solutions logo"
            className="h-10 w-auto"
            height={40}
            src="/logos/logo.jpg"
            width={160}
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className={groupLabelStableClass}>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      className={cn(menuButtonStableClass, menuButtonLabelFadeClass)}
                      isActive={activeTo === item.to}
                      render={<Link to={item.to} />}
                      tooltip={item.label}
                    >
                      <item.icon className="size-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
