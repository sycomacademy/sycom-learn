import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { formatCss, oklch as toOklch } from "culori";

import { useUser } from "@/hooks/use-user";
import { useTRPC } from "@/lib/trpc/client";

const ORG_WORKSPACE_PREFIX = "/dashboard/org";

/** Accent CSS variables derived from active org `#RRGGBB` — only meaningful under `/dashboard/org`. */
export function useOrgWorkspaceThemeStyle(): React.CSSProperties | undefined {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const trpc = useTRPC();
  const {
    data: { session },
  } = useUser();

  const isOrgPath = pathname.startsWith(ORG_WORKSPACE_PREFIX);
  const activeOrgId = session.activeOrganizationId;

  const { data } = useQuery({
    ...trpc.organization.workspaceContext.queryOptions(),
    enabled: isOrgPath && Boolean(activeOrgId),
  });

  return React.useMemo((): React.CSSProperties | undefined => {
    if (!isOrgPath || !data) {
      return undefined;
    }

    const converted = toOklch(data.accentHex);
    if (!converted) {
      return undefined;
    }

    const css = formatCss(converted);
    return {
      "--primary": css,
      "--accent": css,
      "--ring": css,
      "--sidebar-primary": css,
      "--sidebar-accent": css,
      "--sidebar-ring": css,
    } as React.CSSProperties;
  }, [data, isOrgPath]);
}
