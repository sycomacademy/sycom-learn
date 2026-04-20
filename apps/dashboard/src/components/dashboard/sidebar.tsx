import { cn } from "@sycom/ui/lib/utils";
import { CircleHelp, LayoutDashboard, Settings, type LucideIcon } from "lucide-react";
import { useMatchRoute, useRouterState } from "@tanstack/react-router";

import { useUser } from "@/lib/auth/authenticated-context";
import { Link } from "../layout/foresight-link";

type NavItem = {
  icon: LucideIcon;
  label: string;
  pathPrefix?: string;
  to: "/dashboard" | "/help" | "/settings/profile";
};

const links: readonly NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Settings, label: "Settings", pathPrefix: "/settings", to: "/settings/profile" },
  { icon: CircleHelp, label: "Help", to: "/help" },
];

export default function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const matchRoute = useMatchRoute();
  const me = useUser();

  const isNavActive = (item: NavItem) =>
    item.pathPrefix !== undefined
      ? pathname.startsWith(item.pathPrefix)
      : matchRoute({ to: item.to });

  const initials = me.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="hidden w-72 flex-col border-r bg-card md:flex">
      <div className="border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{me.name}</p>
            <p className="truncate text-xs text-muted-foreground">{me.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map((item) => {
          const { icon: Icon, label, to } = item;
          const active = isNavActive(item);
          return (
            <Link
              key={to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
              to={to}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
