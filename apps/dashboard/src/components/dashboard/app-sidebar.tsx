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

const menuButtonIconClass = "[&_svg]:size-5";

const menuButtonCollapseClass =
  "group-data-[collapsible=icon]:size-auto! group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:min-h-12! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:p-2!  group-data-[collapsible=icon]:[&>span:last-child]:hidden";

const groupLabelCollapseClass =
  "group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:opacity-100";

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
      { icon: BlocksIcon, label: "Home", to: "/" },
    ],
  },
];

export function AppSidebar(): React.ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

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
            <SidebarGroupLabel className={cn(groupLabelCollapseClass)}>
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      className={cn(menuButtonIconClass, menuButtonCollapseClass)}
                      isActive={
                        item.to === "/"
                          ? pathname === "/"
                          : pathname === item.to || pathname.startsWith(`${item.to}/`)
                      }
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
