import { useRouterState } from "@tanstack/react-router";

import { useAuthSession, useUser } from "@/lib/auth/use-user";

import UserMenu from "./user-menu";

export default function Header() {
  const me = useUser();
  const session = useAuthSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const sectionTitle = pathname.startsWith("/settings")
    ? "Settings"
    : pathname.startsWith("/help")
      ? "Help"
      : "Dashboard";

  const sessionExpiry = new Date(session.expiresAt).toLocaleString();

  return (
    <header className="border-b bg-background/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {sectionTitle}
          </h1>
          <p className="truncate text-lg font-semibold">
            Welcome back, {me.name.split(" ")[0] ?? me.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-muted-foreground lg:block">
            Session active until {sessionExpiry}
          </p>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
