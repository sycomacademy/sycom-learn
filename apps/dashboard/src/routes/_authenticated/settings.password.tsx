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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sycom/ui/components/input-group";
import { toastManager } from "@sycom/ui/components/toast";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Await, createFileRoute } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Suspense } from "react";
import z from "zod";

import { SettingsPasswordPending } from "@/components/dashboard/settings-pending";
import { useTRPC } from "@/lib/trpc/client";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordInput = z.infer<typeof passwordSchema>;

export const Route = createFileRoute("/_authenticated/settings/password")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.settings.passwordHints.queryOptions());
    const connectedAppsPromise = context.queryClient.fetchQuery(
      context.trpc.settings.connectedApps.queryOptions(),
    );
    return { connectedAppsPromise };
  },
  pendingComponent: SettingsPasswordPending,
  component: SettingsPasswordPage,
});

function SettingsPasswordPage() {
  const trpc = useTRPC();
  const { connectedAppsPromise } = Route.useLoaderData();
  const { data: hints } = useSuspenseQuery(trpc.settings.passwordHints.queryOptions());

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePassword = useMutation(trpc.profile.changePassword.mutationOptions());

  const form = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordInput) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toastManager.add({ title: "Password updated", type: "success" });
      form.reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't change password. Try again.";
      toastManager.add({ title: message, type: "error" });
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Password</h1>
        <p className="text-sm text-muted-foreground">
          Critical: password hints from the server. Deferred: same connected-apps demo as Profile.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
          <CardDescription>
            Min length {hints.minLength}. {hints.tip}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Uses Better Auth via tRPC (session cookie forwarded).</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="max-w-md space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor="current-password">Current password</FieldLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput
                            autoComplete="current-password"
                            id="current-password"
                            type={showCurrent ? "text" : "password"}
                            {...field}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              aria-label={showCurrent ? "Hide password" : "Show password"}
                              onClick={() => setShowCurrent((s) => !s)}
                              size="icon-xs"
                              type="button"
                              variant="ghost"
                            >
                              {showCurrent ? (
                                <EyeOffIcon className="size-4" />
                              ) : (
                                <EyeIcon className="size-4" />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor="new-password">New password</FieldLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput
                            autoComplete="new-password"
                            id="new-password"
                            type={showNew ? "text" : "password"}
                            {...field}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              aria-label={showNew ? "Hide password" : "Show password"}
                              onClick={() => setShowNew((s) => !s)}
                              size="icon-xs"
                              type="button"
                              variant="ghost"
                            >
                              {showNew ? (
                                <EyeOffIcon className="size-4" />
                              ) : (
                                <EyeIcon className="size-4" />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput
                            autoComplete="new-password"
                            id="confirm-password"
                            type={showConfirm ? "text" : "password"}
                            {...field}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              aria-label={showConfirm ? "Hide password" : "Show password"}
                              onClick={() => setShowConfirm((s) => !s)}
                              size="icon-xs"
                              type="button"
                              variant="ghost"
                            >
                              {showConfirm ? (
                                <EyeOffIcon className="size-4" />
                              ) : (
                                <EyeIcon className="size-4" />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />
              <Button loading={form.formState.isSubmitting} type="submit">
                Update password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected apps (deferred)</CardTitle>
          <CardDescription>
            Same deferred resource as Profile for a consistent template.
          </CardDescription>
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
