import { createFileRoute } from "@tanstack/react-router";
import { useUser } from "@/hooks/use-user";
import { useTRPC } from "@/lib/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@sycom/ui/components/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sycom/ui/components/input-group";
import { toastManager } from "@sycom/ui/components/toast";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Badge } from "@sycom/ui/components/badge";
import { formatDeviceLabel, isMobileAgent } from "@sycom/ui/lib/device";
import { LaptopIcon, SmartphoneIcon } from "lucide-react";
import { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "server/trpc/routers/_app";
import * as z from "zod/mini";

export const Route = createFileRoute("/dashboard/settings/security")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.profile.listAccounts.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.profile.listSessions.queryOptions()),
    ]);
  },
  component: SecuritySettings,
});

function SecuritySettings() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <SecuritySessionsActive />
      <SecurityChangePassword />
    </div>
  );
}

function SecuritySessionsActive() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { session } = useUser();
  const listSessionsQueryOptions = trpc.profile.listSessions.queryOptions();
  const { data: sessions } = useSuspenseQuery(listSessionsQueryOptions);
  const revokeSession = useMutation({
    ...trpc.profile.revokeSession.mutationOptions({
      onMutate: async ({ token }) => {
        await queryClient.cancelQueries({ queryKey: listSessionsQueryOptions.queryKey });

        const previousSessions = queryClient.getQueryData<ListSessionsOutput>(
          listSessionsQueryOptions.queryKey,
        );

        queryClient.setQueryData<ListSessionsOutput>(listSessionsQueryOptions.queryKey, (current) =>
          (current ?? []).filter((activeSession) => activeSession.token !== token),
        );

        return { previousSessions };
      },
      onSuccess: () => {
        toastManager.add({ title: "Session revoked", type: "success" });
      },
      onError: (error, _variables, context) => {
        if (context?.previousSessions) {
          queryClient.setQueryData(listSessionsQueryOptions.queryKey, context.previousSessions);
        }

        toastManager.add({ title: error.message, type: "error" });
      },
      onSettled: () => {
        void queryClient.invalidateQueries(listSessionsQueryOptions);
      },
    }),
  });

  const handleRevokeSession = (token: string) => {
    revokeSession.mutate({ token });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Sessions</CardTitle>
        <CardDescription className="text-sm">
          Manage devices where you're signed in.
        </CardDescription>
      </CardHeader>
      <CardPanel className="flex flex-col gap-2">
        {sessions.length === 0 ? (
          <p className="border px-3 py-2.5 text-sm text-muted-foreground">
            No active sessions found.
          </p>
        ) : (
          sessions.map((activeSession) => {
            const DeviceIcon = isMobileAgent(activeSession.userAgent) ? SmartphoneIcon : LaptopIcon;
            const isCurrentSession = session?.token === activeSession.token;
            const isPending =
              revokeSession.isPending && revokeSession.variables?.token === activeSession.token;
            const canRevoke = !isCurrentSession && !isPending;

            return (
              <div
                className="flex flex-wrap items-center justify-between gap-2 border px-3 py-2.5"
                key={activeSession.token}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <DeviceIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  <p className="truncate text-sm">{formatDeviceLabel(activeSession.userAgent)}</p>
                  {isCurrentSession ? (
                    <Badge className="shrink-0" variant="success">
                      This device
                    </Badge>
                  ) : null}
                </div>
                <Button
                  className="px-0 text-destructive hover:text-destructive"
                  disabled={!canRevoke}
                  loading={isPending}
                  onClick={() => {
                    void handleRevokeSession(activeSession.token);
                  }}
                  size="sm"
                  type="button"
                  variant="link"
                >
                  {isCurrentSession ? "Current session" : "Sign out"}
                </Button>
              </div>
            );
          })
        )}
      </CardPanel>
    </Card>
  );
}

type ListSessionsOutput = inferRouterOutputs<AppRouter>["profile"]["listSessions"];

const changePasswordSchema = z
  .object({
    currentPassword: z.string().check(z.minLength(1, "Current password is required")),
    newPassword: z.string().check(z.minLength(8, "Password must be at least 8 characters")),
    confirmNewPassword: z.string(),
  })
  .check(
    z.refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Passwords don't match",
      path: ["confirmNewPassword"],
    }),
  );

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

function SecurityChangePassword() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: accounts } = useSuspenseQuery(trpc.profile.listAccounts.queryOptions());
  const hasPasswordAccount = accounts.some((account) => account.providerId === "credential");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const changePassword = useMutation({
    ...trpc.profile.changePassword.mutationOptions({
      onSuccess: () => {
        toastManager.add({ title: "Password updated", type: "success" });
        queryClient.invalidateQueries(trpc.profile.listAccounts.queryOptions());
        form.reset();
      },
      onError: (error) => {
        toastManager.add({ title: error.message, type: "error" });
      },
    }),
  });

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });
    } catch (error) {
      toastManager.add({
        title: "Couldn't change password",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-sm">Change password</CardTitle>
            <CardDescription className="text-sm">
              {hasPasswordAccount
                ? "Update your password to keep your account secure."
                : "You signed in with an external provider. Use the password reset flow if you'd like to set a Sycom password."}
            </CardDescription>
          </CardHeader>
          <CardPanel className="space-y-4 py-0">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field>
                    <FieldLabel>Current password</FieldLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          autoComplete="current-password"
                          disabled={!hasPasswordAccount}
                          placeholder="Current password"
                          type={showCurrent ? "text" : "password"}
                          {...field}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            aria-label={showCurrent ? "Hide password" : "Show password"}
                            disabled={!hasPasswordAccount}
                            onClick={() => setShowCurrent((s) => !s)}
                          >
                            {showCurrent ? (
                              <EyeOffIcon className="size-3.5" />
                            ) : (
                              <EyeIcon className="size-3.5" />
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
                    <FieldLabel>New password</FieldLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          autoComplete="new-password"
                          disabled={!hasPasswordAccount}
                          placeholder="New password"
                          type={showNew ? "text" : "password"}
                          {...field}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            aria-label={showNew ? "Hide password" : "Show password"}
                            disabled={!hasPasswordAccount}
                            onClick={() => setShowNew((s) => !s)}
                          >
                            {showNew ? (
                              <EyeOffIcon className="size-3.5" />
                            ) : (
                              <EyeIcon className="size-3.5" />
                            )}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FieldDescription>
                      At least 8 characters with a mix of letters and numbers.
                    </FieldDescription>
                    <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                  </Field>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field>
                    <FieldLabel>Confirm new password</FieldLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          autoComplete="new-password"
                          disabled={!hasPasswordAccount}
                          placeholder="Confirm new password"
                          type={showConfirm ? "text" : "password"}
                          {...field}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            aria-label={showConfirm ? "Hide password" : "Show password"}
                            disabled={!hasPasswordAccount}
                            onClick={() => setShowConfirm((s) => !s)}
                          >
                            {showConfirm ? (
                              <EyeOffIcon className="size-3.5" />
                            ) : (
                              <EyeIcon className="size-3.5" />
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
          </CardPanel>
          <CardFooter className="justify-end pt-0">
            <Button
              disabled={!hasPasswordAccount}
              loading={form.formState.isSubmitting}
              type="submit"
            >
              Update password
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
