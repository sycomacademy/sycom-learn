import { Card, CardContent, CardHeader } from "@sycom/ui/components/card";
import { Skeleton } from "@sycom/ui/components/skeleton";

export function SettingsProfilePending() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </header>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-28" />
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsPasswordPending() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </header>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-28" />
        </CardContent>
      </Card>
    </div>
  );
}
