"use client";

import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import { BuildingIcon } from "@sycom/ui/components/animated/icons/building";
import { LayersIcon } from "@sycom/ui/components/animated/icons/layers";
import { LayoutDashboardIcon } from "@sycom/ui/components/animated/icons/layout-dashboard";
import { MessageCircleQuestionIcon } from "@sycom/ui/components/animated/icons/message-circle-question";
import { SettingsIcon } from "@sycom/ui/components/animated/icons/settings";
import { UsersIcon } from "@sycom/ui/components/animated/icons/users";
import { BRAND, Image } from "@sycom/ui/image";
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
import { useUser } from "@/hooks/use-user";
import type { TRoutes } from "@/router";
import { cn } from "@sycom/ui/lib/utils";
import { AnimateIcon } from "@sycom/ui/components/animated/icons/icon";
import type { UserRole } from "@sycom/db/schema/auth";

type NavIcon = React.ComponentType<{ className?: string }>;

type NavItem = {
  icon: NavIcon;
  label: string;
  to: TRoutes;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const COMMON_NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      { icon: MessageCircleQuestionIcon, label: "Support", to: "/dashboard/support" },
      { icon: SettingsIcon, label: "Settings", to: "/dashboard/settings" },
    ],
  },
];

const PLATFORM_ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboardIcon, label: "Overview", to: "/dashboard" },
      { icon: UsersIcon, label: "Users", to: "/dashboard/admin/users" },
      { icon: BuildingIcon, label: "Organizations", to: "/dashboard/admin/organizations" },
    ],
  },
  {
    label: "Courses",
    items: [{ icon: LayersIcon, label: "Catalog", to: "/dashboard/admin/catalog" }],
  },
];

const menuButtonStableClass = cn(
  "transition-[width,height,padding,margin] duration-240 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
);

const menuButtonLabelFadeClass = cn("group-data-[collapsible=icon]:[&>span:last-child]:opacity-0");

const groupLabelStableClass = cn(
  "group-data-[collapsible=icon]:mt-0",
  "group-data-[collapsible=icon]:opacity-0",
  "group-data-[collapsible=icon]:pointer-events-none",
);

export function AppSidebar(): React.ReactElement {
  const { user } = useUser();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navGroups = getNavGroups(normalizeUserRole(user.role));

  let activeTo: TRoutes | undefined;
  let bestLength = -1;
  for (const group of navGroups) {
    for (const item of group.items) {
      const matches = pathname === item.to || pathname.startsWith(`${item.to}/`);
      if (matches && item.to.length > bestLength) {
        activeTo = item.to;
        bestLength = item.to.length;
      }
    }
  }

  return (
    <Sidebar className="border-sidebar-border" collapsible="icon" variant="inset">
      <SidebarHeader>
        <Link
          className="flex w-fit items-center gap-2 text-sm font-semibold text-sidebar-foreground"
          href="/dashboard"
        >
          <Image
            alt="Sycom Solutions logo"
            className="rounded object-contain"
            height={40}
            width={40}
            src={BRAND.LOGO_ICON}
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className={groupLabelStableClass}>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ to, label, icon: Icon }) => {
                  return (
                    <SidebarMenuItem key={label}>
                      <AnimateIcon animateOnHover>
                        <SidebarMenuButton
                          className={cn(menuButtonStableClass, menuButtonLabelFadeClass)}
                          isActive={activeTo === to}
                          render={<Link to={to} />}
                          tooltip={label}
                          size="lg"
                        >
                          <Icon className="size-6" />
                          <span>{label}</span>
                        </SidebarMenuButton>
                      </AnimateIcon>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

function getNavGroups(role: UserRole | null): NavGroup[] {
  const navGroups: NavGroup[] = [];

  if (role === "platform_admin") {
    navGroups.push(...PLATFORM_ADMIN_NAV_GROUPS);
  }
  navGroups.push(...COMMON_NAV_GROUPS);

  return navGroups;
}

function normalizeUserRole(role: string | null | undefined): UserRole | null {
  if (role === "platform_admin" || role === "content_creator" || role === "public_student") {
    return role;
  }

  return null;
}
