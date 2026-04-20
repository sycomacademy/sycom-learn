import { cn } from "@sycom/ui/lib/utils";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { Link } from "@/components/layout/foresight-link";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsLayout,
});

const tabs = [
  { to: "/settings/profile", label: "Profile" },
  { to: "/settings/password", label: "Password" },
] as const;

function SettingsLayout() {
  return (
    <div className="flex flex-col gap-8 p-6 lg:flex-row lg:gap-10">
      <nav aria-label="Settings sections" className="flex shrink-0 gap-2 lg:w-48 lg:flex-col">
        {tabs.map(({ to, label }) => (
          <Link
            key={to}
            activeProps={{ className: "bg-accent text-accent-foreground" }}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/80 hover:text-accent-foreground",
            )}
            inactiveProps={{ className: "text-muted-foreground" }}
            to={to}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
