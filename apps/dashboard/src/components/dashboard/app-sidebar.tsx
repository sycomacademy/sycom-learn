import * as React from "react";
import { BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { BlocksIcon } from "@sycom/ui/components/animated/icons/blocks";
import { BuildingIcon } from "@sycom/ui/components/animated/icons/building";
import { CompassIcon } from "@sycom/ui/components/animated/icons/compass";
import { ChartLineIcon } from "@sycom/ui/components/animated/icons/chart-line";
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
import { OrganizationSwitcher } from "@/components/dashboard/organization-switcher";
import { dashboardHomeRoute } from "@/lib/auth/dashboard-home-route";
import {
  type OrgWorkspacePrimarySlug,
  getOrgWorkspacePrimarySlugs,
  orgWorkspaceSlugToLabel,
  orgWorkspaceSlugToPath,
} from "@/lib/org-workspace-nav";
import { useTRPC } from "@/lib/trpc/client";
import { useUser } from "@/hooks/use-user";
import type { TRoutes } from "@/router";
import { cn } from "@sycom/ui/lib/utils";
import { AnimateIcon } from "@sycom/ui/components/animated/icons/icon";
import type { OrganizationRole, UserRole } from "@sycom/db/schema/auth";

const ORG_WORKSPACE_PREFIX = "/dashboard/org";

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

const ORG_GENERAL_NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      {
        icon: MessageCircleQuestionIcon,
        label: "Support",
        to: "/dashboard/org/support",
      },
      { icon: SettingsIcon, label: "Settings", to: "/dashboard/org/settings" },
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
      {
        icon: ChartLineIcon,
        label: "Logs/Analytics",
        to: "/dashboard/admin/logs-analytics",
      },
    ],
  },
  {
    label: "Courses",
    items: [{ icon: LayersIcon, label: "Courses", to: "/dashboard/course" }],
  },
];

const CONTENT_CREATOR_NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [{ icon: LayoutDashboardIcon, label: "Overview", to: "/dashboard" }],
  },
  {
    label: "Courses",
    items: [{ icon: LayersIcon, label: "Courses", to: "/dashboard/course" }],
  },
];

const PUBLIC_STUDENT_NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [{ icon: LayoutDashboardIcon, label: "Overview", to: "/dashboard" }],
  },
  {
    label: "Courses",
    items: [
      { icon: CompassIcon, label: "Catalog", to: "/dashboard/catalog" },
      { icon: BlocksIcon, label: "My library", to: "/dashboard/library" },
    ],
  },
];

const ORG_NAV_ICON_BY_SLUG: Record<OrgWorkspacePrimarySlug, NavIcon> = {
  overview: LayoutDashboardIcon,
  users: UsersIcon,
  cohorts: BlocksIcon,
  organization: BuildingIcon,
  courses: LayersIcon,
  library: BookOpen,
};

function buildOrgWorkspaceNavGroups(role: OrganizationRole | undefined): NavGroup[] {
  const slugs: OrgWorkspacePrimarySlug[] = role ? getOrgWorkspacePrimarySlugs(role) : ["overview"];
  return [
    {
      label: "Organization",
      items: slugs.map((slug) => ({
        icon: ORG_NAV_ICON_BY_SLUG[slug],
        label: orgWorkspaceSlugToLabel(slug),
        to: orgWorkspaceSlugToPath(slug),
      })),
    },
  ];
}

const menuButtonStableClass = cn(
  "transition-[width,height,padding,margin] duration-240 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
);

const menuButtonLabelFadeClass = cn("group-data-[collapsible=icon]:[&>span:last-child]:opacity-0");

const groupLabelStableClass = cn(
  "group-data-[collapsible=icon]:mt-0",
  "group-data-[collapsible=icon]:opacity-0",
  "group-data-[collapsible=icon]:pointer-events-none",
);

function rewriteOverviewTargets(groups: NavGroup[], homePath: TRoutes): NavGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => (item.to === "/dashboard" ? { ...item, to: homePath } : item)),
  }));
}

export function AppSidebar(): React.ReactElement {
  const {
    data: { user, session },
  } = useUser();
  const trpc = useTRPC();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const homePath = dashboardHomeRoute(session.activeOrganizationId);
  const isOrgWorkspace = pathname.startsWith(ORG_WORKSPACE_PREFIX);

  const workspaceContextQuery = useQuery({
    ...trpc.organization.workspaceContext.queryOptions(),
    enabled: isOrgWorkspace && Boolean(session.activeOrganizationId),
  });

  const navGroups = isOrgWorkspace
    ? [
        ...buildOrgWorkspaceNavGroups(workspaceContextQuery.data?.memberRole),
        ...ORG_GENERAL_NAV_GROUPS,
      ]
    : [
        ...rewriteOverviewTargets(getPlatformRoleNavGroups(normalizeUserRole(user.role)), homePath),
        ...COMMON_NAV_GROUPS,
      ];

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

  const headerLinkTo: TRoutes = isOrgWorkspace ? "/dashboard/org" : homePath;
  const orgLogoPublicId = workspaceContextQuery.data?.logoPublicId?.trim();
  const logoSrc = isOrgWorkspace && orgLogoPublicId ? orgLogoPublicId : BRAND.LOGO_ICON;
  const orgName = workspaceContextQuery.data?.name?.trim();
  const logoAlt = isOrgWorkspace && orgName ? `${orgName} logo` : "Sycom Solutions logo";

  return (
    <Sidebar className="border-sidebar-border" collapsible="icon" variant="inset">
      <SidebarHeader>
        <Link
          className="flex w-fit items-center gap-2 text-sm font-semibold text-sidebar-foreground"
          to={headerLinkTo}
        >
          <Image
            alt={logoAlt}
            className="rounded object-contain"
            height={40}
            width={40}
            src={logoSrc}
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
                    <SidebarMenuItem key={to}>
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
      <OrganizationSwitcher />
    </Sidebar>
  );
}

function getPlatformRoleNavGroups(role: UserRole | null): NavGroup[] {
  const navGroups: NavGroup[] = [];

  if (role === "platform_admin") {
    navGroups.push(...PLATFORM_ADMIN_NAV_GROUPS);
  }
  if (role === "content_creator") {
    navGroups.push(...CONTENT_CREATOR_NAV_GROUPS);
  }
  if (role === "public_student") {
    navGroups.push(...PUBLIC_STUDENT_NAV_GROUPS);
  }

  return navGroups;
}

function normalizeUserRole(role: string | null | undefined): UserRole | null {
  if (role === "platform_admin" || role === "content_creator" || role === "public_student") {
    return role;
  }

  return null;
}
