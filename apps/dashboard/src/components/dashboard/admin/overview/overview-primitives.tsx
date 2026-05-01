import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sycom/ui/components/card";
import { Skeleton } from "@sycom/ui/components/skeleton";
import { cn } from "@sycom/ui/lib/utils";

export type OverviewStatCardProps = {
  description: string;
  icon: LucideIcon;
  title: string;
  value: string;
};

export function OverviewStatCard({
  description,
  icon: Icon,
  title,
  value,
}: OverviewStatCardProps): React.ReactElement {
  return (
    <Card className="shadow-xs">
      <CardHeader className="gap-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardDescription>{title}</CardDescription>
          <div className="flex size-8 shrink-0 items-center justify-center border border-border bg-muted/50">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl tracking-tight">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-6">
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function OverviewSectionSkeleton({ className }: { className?: string }): React.ReactElement {
  return <Skeleton className={cn("h-80 w-full rounded-2xl", className)} />;
}

export function OverviewStatsSkeleton(): React.ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <OverviewSectionSkeleton className="h-36" key={`stat-${String(index)}`} />
      ))}
    </div>
  );
}

export type OverviewListEmptyProps = {
  description: string;
  title: string;
};

export function OverviewListEmpty({
  description,
  title,
}: OverviewListEmptyProps): React.ReactElement {
  return (
    <div className="flex h-full min-h-56 flex-col items-center justify-center gap-2 border border-dashed border-border p-6 text-center">
      <div className="flex size-10 items-center justify-center border border-border bg-muted/50">
        <ArrowUpRight className="size-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
