import { Card, CardContent, CardHeader } from "@sycom/ui/components/card";
import { Skeleton } from "@sycom/ui/components/skeleton";

export function DashboardPending() {
  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
