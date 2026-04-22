import { useUser } from "@/hooks/use-user";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const profile = useUser();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back.</p>
      </div>

      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Profile snapshot</h2>
        <pre className="overflow-x-auto rounded-md bg-muted/50 p-4 text-xs">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </section>
    </div>
  );
}
