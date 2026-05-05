import type * as React from "react";

import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";

type DashboardShellProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function DashboardShell({
  children,
  defaultOpen = true,
}: DashboardShellProps): React.ReactElement {
  return <DashboardChrome defaultOpen={defaultOpen}>{children}</DashboardChrome>;
}
