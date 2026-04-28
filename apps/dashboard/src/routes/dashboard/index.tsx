import { createFileRoute } from "@tanstack/react-router";
import { useUser } from "@/hooks/use-user";
import { JsonViewer } from "@sycom/ui/components/elements/json-viewer";

export const Route = createFileRoute("/dashboard/")({
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
        <JsonViewer
          data={JSON.parse(JSON.stringify(profile))}
          searchable
          copyPath
          collapsed={2}
        />{" "}
      </section>
    </div>
  );
}
