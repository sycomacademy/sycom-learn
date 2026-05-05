import { Link } from "@tanstack/react-router";
import { HomeIcon } from "lucide-react";

import { Button } from "@sycom/ui/components/button";

export function LearnHeader({
  courseTitle,
  progressPercent,
}: {
  courseTitle: string;
  progressPercent: number;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b bg-background px-4 py-3">
      <Button render={<Link to="/dashboard" />} size="sm" variant="outline">
        <HomeIcon />
        Home
      </Button>
      <div className="min-w-0 text-right">
        <p className="truncate text-sm font-medium">{courseTitle}</p>
        <p className="text-xs text-muted-foreground">{progressPercent}% complete</p>
      </div>
    </header>
  );
}
