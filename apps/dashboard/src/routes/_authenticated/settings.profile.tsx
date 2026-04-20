import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sycom/ui/components/card";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import { toastManager } from "@sycom/ui/components/toast";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Await, createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Suspense } from "react";
import z from "zod";

import { SettingsProfilePending } from "@/components/dashboard/settings-pending";
import { useUser } from "@/lib/auth/authenticated-context";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

type ProfileInput = z.infer<typeof profileSchema>;

export const Route = createFileRoute("/_authenticated/settings/profile")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.settings.preferences.queryOptions());
    const connectedAppsPromise = context.queryClient.fetchQuery(
      context.trpc.settings.connectedApps.queryOptions(),
    );
    return { connectedAppsPromise };
  },
  pendingComponent: SettingsProfilePending,
  component: SettingsProfilePage,
});

function SettingsProfilePage() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const me = useUser();
  const { connectedAppsPromise } = Route.useLoaderData();

  const { data: preferences } = useSuspenseQuery(trpc.settings.preferences.queryOptions());

  const updateMe = useMutation({
    mutationFn: (input: { name?: string }) => trpcClient.me.update.mutate(input),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: trpc.me.get.queryKey() });
      const previous = queryClient.getQueryData(trpc.me.get.queryKey());
      queryClient.setQueryData(trpc.me.get.queryKey(), (old) =>
        old && variables.name !== undefined ? { ...old, name: variables.name } : old,
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(trpc.me.get.queryKey(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: trpc.me.get.queryKey() });
    },
  });

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: { name: me.name },
  });

  const onSubmit = async (data: ProfileInput) => {
    try {
      await updateMe.mutateAsync({ name: data.name });
      toastManager.add({ title: "Profile updated", type: "success" });
    } catch {
      toastManager.add({
        title: "Couldn't update profile. Check your connection and try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Name updates optimistically in the shell; the server mutation rolls back on failure.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Display name</CardTitle>
          <CardDescription>This is shown across the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="max-w-md space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor="profile-name">Name</FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="name"
                          id="profile-name"
                          placeholder="Your name"
                          {...field}
                        />
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />
              <Button loading={form.formState.isSubmitting} type="submit">
                Save
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences (critical loader)</CardTitle>
          <CardDescription>
            Loaded with <code className="text-xs">ensureQueryData</code> — needed for this panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Weekly digest: {preferences.weeklyDigest ? "On" : "Off"}</p>
          <p>Timezone: {preferences.timezone}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected apps (deferred)</CardTitle>
          <CardDescription>Streams in after first paint via Suspense + Await.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<p className="text-sm text-muted-foreground">Loading connections…</p>}
          >
            <Await promise={connectedAppsPromise}>
              {(apps) => (
                <ul className="space-y-2 text-sm">
                  {apps.map((app) => (
                    <li key={app.id} className="flex justify-between gap-2">
                      <span>{app.name}</span>
                      <span className="text-muted-foreground">{app.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Await>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
