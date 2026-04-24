import { Tabs, TabsList, TabsTab } from "@sycom/ui/components/tabs";
import { useRouterState } from "@tanstack/react-router";

import { Link } from "@/components/layout/foresight-link";
import type { TRoutes } from "@/router";

export interface SecondaryMenuItem {
  path: TRoutes;
  label: string;
}

interface SecondaryMenuProps {
  label: string;
  base: TRoutes;
  items: SecondaryMenuItem[];
}

function getActivePath(pathname: string, base: string, items: SecondaryMenuItem[]): string {
  const active = items.find(({ path }) => {
    const isBase = path === base;
    return isBase ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  });
  return active?.path ?? pathname;
}

export function SecondaryMenu({ label, base, items }: SecondaryMenuProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeValue = getActivePath(pathname, base, items);

  return (
    <Tabs
      aria-label={label}
      className="-mx-4 border-b border-border pb-4 sm:mx-0"
      value={activeValue}
    >
      <TabsList variant="underline">
        {items.map(({ path, label }) => (
          <TabsTab key={path} nativeButton={false} render={<Link to={path} />} value={path}>
            {label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
}
