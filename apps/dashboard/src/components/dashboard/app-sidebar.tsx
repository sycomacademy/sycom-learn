"use client";

import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  BlocksIcon,
  LayoutDashboardIcon,
  MessageCircleQuestionIcon,
  SettingsIcon,
} from "lucide-react";
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
  SidebarSeparator,
} from "@sycom/ui/components/sidebar";
import { Link } from "@/components/layout/foresight-link";

type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: "/dashboard" | "/settings" | "/";
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
  {
    label: "General",
    items: [
      { icon: SettingsIcon, label: "Settings", to: "/settings" },
      { icon: MessageCircleQuestionIcon, label: "Support", to: "/" },
    ],
  },
];

export function AppSidebar(): React.ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isActiveRoute = React.useCallback(
    (to: NavItem["to"]) => {
      if (to === "/") {
        return pathname === "/";
      }
      return pathname === to || pathname.startsWith(`${to}/`);
    },
    [pathname],
  );

  return (
    <Sidebar className="border-sidebar-border" collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to="/dashboard" />}>
              <div className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboardIcon className="size-3" />
              </div>
              <span className="truncate font-semibold">Sycom</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActiveRoute(item.to)}
                      render={<Link to={item.to} />}
                      tooltip={item.label}
                    >
                      <item.icon />
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
