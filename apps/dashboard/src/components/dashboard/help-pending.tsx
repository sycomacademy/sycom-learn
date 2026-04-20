import { Card, CardContent, CardHeader } from "@sycom/ui/components/card";
import { Skeleton } from "@sycom/ui/components/skeleton";

export function HelpPending() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
