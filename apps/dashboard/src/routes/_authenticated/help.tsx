import { Card, CardContent, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Await, createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { HelpPending } from "@/components/dashboard/help-pending";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/_authenticated/help")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.help.sections.queryOptions());
    const suggestedPromise = context.queryClient.fetchQuery(
      context.trpc.help.suggested.queryOptions(),
    );
    return { suggestedPromise };
  },
  pendingComponent: HelpPending,
  component: HelpPage,
});

function HelpPage() {
  const trpc = useTRPC();
  const { suggestedPromise } = Route.useLoaderData();
  const { data: sections } = useSuspenseQuery(trpc.help.sections.queryOptions());

  return (
    <div className="space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Help</h1>
        <p className="text-sm text-muted-foreground">
          Critical sections load in the route loader; suggested articles defer behind Suspense +
          Await.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Reference content for {section.id}.</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Suggested for you (deferred)</h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading suggestions…</p>}>
          <Await promise={suggestedPromise}>
            {(items) => (
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {items.map((item) => (
                  <li key={item.title}>
                    <a
                      className="text-foreground underline-offset-4 hover:underline"
                      href={item.href}
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Await>
        </Suspense>
      </section>
    </div>
  );
}
