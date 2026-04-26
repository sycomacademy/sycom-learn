import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sycom/ui/components/button";
import { Badge } from "@sycom/ui/components/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@sycom/ui/components/card";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@sycom/ui/components/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sycom/ui/components/input-group";
import { QRCode } from "@sycom/ui/components/qr-code";
import { toastManager } from "@sycom/ui/components/toast";
import { formatDeviceLabel, isMobileAgent } from "@sycom/ui/lib/device";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  LaptopIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { useUser } from "@/hooks/use-user";
import { authClient } from "@/lib/auth/auth-client";
import { useTRPC } from "@/lib/trpc/client";
import type { AppRouter } from "server/trpc/routers/_app";

const linkedAccountProviders = ["google", "linkedin"] as const;

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

const passwordConfirmationSchema = z.object({
  password: z.string().check(z.minLength(1, "Current password is required")),
});

const verifyTotpSchema = z.object({
  code: z.string().check(z.minLength(6, "Enter your authenticator code")),
});

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
type PasswordConfirmationInput = z.infer<typeof passwordConfirmationSchema>;
type VerifyTotpInput = z.infer<typeof verifyTotpSchema>;
type LinkedAccountProvider = (typeof linkedAccountProviders)[number];
type ListSessionsOutput = inferRouterOutputs<AppRouter>["profile"]["listSessions"];

const linkedAccountProviderConfig: Record<
  LinkedAccountProvider,
  { description: string; icon: typeof GoogleIcon; label: string }
> = {
  google: {
    description: "Use your Google account for sign-in and account recovery.",
    icon: GoogleIcon,
    label: "Google",
  },
  linkedin: {
    description: "Connect LinkedIn so you can sign in without a separate Sycom password.",
    icon: LinkedInIcon,
    label: "LinkedIn",
  },
};

export const Route = createFileRoute("/dashboard/settings/security")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.profile.listAccounts.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.profile.listPasskeys.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.profile.listSessions.queryOptions()),
    ]);
  },
  component: SecuritySettings,
});

function SecuritySettings() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <SecuritySessionsActive />
      <SecurityPasskeys />
      <SecurityLinkedAccounts />
      <SecurityTwoFactorAuthentication />
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
                  disabled={isCurrentSession}
                  loading={isPending}
                  onClick={() => {
                    revokeSession.mutate({ token: activeSession.token });
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

function SecurityPasskeys() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listPasskeysQueryOptions = trpc.profile.listPasskeys.queryOptions();
  const { data: passkeys } = useSuspenseQuery(listPasskeysQueryOptions);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(null);

  const refreshPasskeys = async () => {
    await queryClient.invalidateQueries(listPasskeysQueryOptions);
  };

  const handleAddPasskey = async () => {
    try {
      const { error } = await authClient.passkey.addPasskey({
        authenticatorAttachment: "platform",
        name: "Sycom LMS",
      });

      if (error) {
        toastManager.add({
          title: "Couldn't add passkey",
          description: error.message,
          type: "error",
        });
        return;
      }

      setAddDialogOpen(false);
      toastManager.add({ title: "Passkey added", type: "success" });
      await refreshPasskeys();
    } catch (error) {
      toastManager.add({
        title: "Couldn't add passkey",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  const handleDeletePasskey = async (id: string) => {
    setDeletingPasskeyId(id);

    try {
      const { error } = await authClient.passkey.deletePasskey({ id });

      if (error) {
        toastManager.add({
          title: "Couldn't remove passkey",
          description: error.message,
          type: "error",
        });
        return;
      }

      toastManager.add({ title: "Passkey removed", type: "success" });
      await refreshPasskeys();
    } catch (error) {
      toastManager.add({
        title: "Couldn't remove passkey",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setDeletingPasskeyId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Passkeys</CardTitle>
          <CardDescription className="text-sm">
            Register a passkey on this device for faster, phishing-resistant sign-in later.
          </CardDescription>
        </CardHeader>
        <CardPanel className="space-y-3 py-0">
          {passkeys.length === 0 ? (
            <div className="border px-3 py-2.5 text-sm text-muted-foreground">
              No passkeys registered yet.
            </div>
          ) : (
            passkeys.map((passkey) => (
              <div
                className="flex items-center justify-between gap-3 border px-3 py-2.5"
                key={passkey.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {passkey.name ?? "Unnamed passkey"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added {passkey.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <Button
                  aria-label="Remove passkey"
                  loading={deletingPasskeyId === passkey.id}
                  onClick={() => {
                    void handleDeletePasskey(passkey.id);
                  }}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))
          )}
        </CardPanel>
        <CardFooter className="justify-end">
          <Button onClick={() => setAddDialogOpen(true)} size="sm" type="button">
            <PlusIcon className="size-4" />
            Add passkey
          </Button>
        </CardFooter>
      </Card>

      <Dialog onOpenChange={setAddDialogOpen} open={addDialogOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Add passkey</DialogTitle>
            <DialogDescription>
              Your browser will ask you to confirm with Face ID, Touch ID, Windows Hello, or your
              device PIN.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setAddDialogOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button onClick={() => void handleAddPasskey()} type="button">
              Add passkey
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}

function SecurityLinkedAccounts() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listAccountsQueryOptions = trpc.profile.listAccounts.queryOptions();
  const { data: accounts } = useSuspenseQuery(listAccountsQueryOptions);
  const [linkingProvider, setLinkingProvider] = useState<LinkedAccountProvider | null>(null);
  const [unlinkingProviderId, setUnlinkingProviderId] = useState<string | null>(null);

  const refreshAccounts = async () => {
    await queryClient.invalidateQueries(listAccountsQueryOptions);
  };

  const getProviderAccount = (provider: LinkedAccountProvider) =>
    accounts.find(
      (account) => account.providerId === provider || account.providerId.startsWith(`${provider}:`),
    );

  const handleLinkAccount = async (provider: LinkedAccountProvider) => {
    setLinkingProvider(provider);

    try {
      const { error } = await authClient.linkSocial({
        callbackURL: "/dashboard/settings/security",
        provider,
      });

      if (error) {
        toastManager.add({
          title: "Couldn't link account",
          description: error.message,
          type: "error",
        });
      }
    } catch (error) {
      toastManager.add({
        title: "Couldn't link account",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleUnlinkAccount = async (providerId: string) => {
    setUnlinkingProviderId(providerId);

    try {
      const { error } = await authClient.unlinkAccount({ providerId });

      if (error) {
        toastManager.add({
          title: "Couldn't unlink account",
          description: error.message,
          type: "error",
        });
        return;
      }

      toastManager.add({ title: "Account unlinked", type: "success" });
      await refreshAccounts();
    } catch (error) {
      toastManager.add({
        title: "Couldn't unlink account",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setUnlinkingProviderId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Linked accounts</CardTitle>
        <CardDescription className="text-sm">
          Connect a trusted social account so you can sign in with fewer steps.
        </CardDescription>
      </CardHeader>
      <CardPanel className="space-y-3 py-0">
        {linkedAccountProviders.map((provider) => {
          const providerAccount = getProviderAccount(provider);
          const providerConfig = linkedAccountProviderConfig[provider];
          const ProviderIcon = providerConfig.icon;

          return (
            <div
              className="flex items-center justify-between gap-3 border px-3 py-2.5"
              key={provider}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted">
                  <ProviderIcon />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{providerConfig.label}</p>
                    {providerAccount ? (
                      <Badge className="gap-1" variant="success">
                        <CheckIcon className="size-3" />
                        Linked
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{providerConfig.description}</p>
                </div>
              </div>
              {providerAccount ? (
                <Button
                  loading={unlinkingProviderId === providerAccount.providerId}
                  onClick={() => {
                    void handleUnlinkAccount(providerAccount.providerId);
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  loading={linkingProvider === provider}
                  onClick={() => {
                    void handleLinkAccount(provider);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Connect
                </Button>
              )}
            </div>
          );
        })}
      </CardPanel>
    </Card>
  );
}

function SecurityTwoFactorAuthentication() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const profileQueryOptions = trpc.profile.get.queryOptions();
  const twoFactorEnabled = Boolean(
    (user as { twoFactorEnabled?: boolean | null }).twoFactorEnabled,
  );
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [totpUri, setTotpUri] = useState<string | null>(null);

  const enableForm = useForm<PasswordConfirmationInput>({
    resolver: zodResolver(passwordConfirmationSchema),
    defaultValues: { password: "" },
  });
  const verifyForm = useForm<VerifyTotpInput>({
    resolver: zodResolver(verifyTotpSchema),
    defaultValues: { code: "" },
  });
  const regenerateForm = useForm<PasswordConfirmationInput>({
    resolver: zodResolver(passwordConfirmationSchema),
    defaultValues: { password: "" },
  });
  const disableForm = useForm<PasswordConfirmationInput>({
    resolver: zodResolver(passwordConfirmationSchema),
    defaultValues: { password: "" },
  });

  const refreshProfile = async () => {
    await queryClient.invalidateQueries(profileQueryOptions);
  };

  const handleEnable = async (data: PasswordConfirmationInput) => {
    try {
      const { data: response, error } = await authClient.twoFactor.enable({
        issuer: "Sycom LMS",
        password: data.password,
      });

      if (error) {
        toastManager.add({
          title: "Couldn't start 2FA setup",
          description: error.message,
          type: "error",
        });
        return;
      }

      setBackupCodes(response?.backupCodes ?? []);
      setTotpUri(response?.totpURI ?? null);
      setSetupDialogOpen(true);
      verifyForm.reset({ code: "" });
      toastManager.add({ title: "2FA setup started", type: "success" });
    } catch (error) {
      toastManager.add({
        title: "Couldn't start 2FA setup",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  const handleVerify = async (data: VerifyTotpInput) => {
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: data.code,
        trustDevice: true,
      });

      if (error) {
        toastManager.add({
          title: "Couldn't verify code",
          description: error.message,
          type: "error",
        });
        return;
      }

      setSetupDialogOpen(false);
      setTotpUri(null);
      verifyForm.reset({ code: "" });
      toastManager.add({ title: "Two-factor enabled", type: "success" });
      await refreshProfile();
    } catch (error) {
      toastManager.add({
        title: "Couldn't verify code",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  const handleDisable = async (data: PasswordConfirmationInput) => {
    try {
      const { error } = await authClient.twoFactor.disable({ password: data.password });

      if (error) {
        toastManager.add({
          title: "Couldn't disable 2FA",
          description: error.message,
          type: "error",
        });
        return;
      }

      disableForm.reset({ password: "" });
      setBackupCodes([]);
      toastManager.add({ title: "Two-factor disabled", type: "success" });
      await refreshProfile();
    } catch (error) {
      toastManager.add({
        title: "Couldn't disable 2FA",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  const handleRegenerateBackupCodes = async (data: PasswordConfirmationInput) => {
    try {
      const { data: response, error } = await authClient.twoFactor.generateBackupCodes({
        password: data.password,
      });

      if (error) {
        toastManager.add({
          title: "Couldn't regenerate backup codes",
          description: error.message,
          type: "error",
        });
        return;
      }

      setBackupCodes(response?.backupCodes ?? []);
      regenerateForm.reset({ password: "" });
      toastManager.add({ title: "Backup codes regenerated", type: "success" });
    } catch (error) {
      toastManager.add({
        title: "Couldn't regenerate backup codes",
        description:
          error instanceof Error
            ? error.message
            : "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  const copyText = async (text: string, title: string) => {
    await navigator.clipboard.writeText(text);
    toastManager.add({ title, type: "success" });
  };

  const resetTwoFactorDialog = (open: boolean) => {
    setSetupDialogOpen(open);

    if (!open) {
      setTotpUri(null);
      verifyForm.reset({ code: "" });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Two-factor authentication</CardTitle>
          <CardDescription className="text-sm">
            Add a verification step with an authenticator app to better protect your account.
          </CardDescription>
        </CardHeader>
        <CardPanel className="space-y-4 py-0">
          {twoFactorEnabled ? (
            <>
              <div className="border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
                Two-factor authentication is enabled for this account.
              </div>

              <Form {...regenerateForm}>
                <form
                  className="space-y-3"
                  onSubmit={regenerateForm.handleSubmit(handleRegenerateBackupCodes)}
                >
                  <FormField
                    control={regenerateForm.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <Field>
                          <FieldLabel>Current password</FieldLabel>
                          <FormControl>
                            <Input
                              autoComplete="current-password"
                              placeholder="Current password"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FieldDescription>
                            Required to generate a fresh set of backup codes.
                          </FieldDescription>
                          <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                        </Field>
                      </FormItem>
                    )}
                  />

                  <Button
                    loading={regenerateForm.formState.isSubmitting}
                    size="sm"
                    type="submit"
                    variant="outline"
                  >
                    <RefreshCwIcon className="size-4" />
                    Regenerate backup codes
                  </Button>
                </form>
              </Form>

              {backupCodes.length > 0 ? (
                <div className="space-y-2 border bg-muted/40 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">Backup codes</p>
                    <Button
                      className="px-0"
                      onClick={() => void copyText(backupCodes.join("\n"), "Backup codes copied")}
                      size="sm"
                      type="button"
                      variant="link"
                    >
                      <CopyIcon className="size-4" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs break-all whitespace-pre-wrap text-muted-foreground">
                    {backupCodes.join("\n")}
                  </pre>
                </div>
              ) : null}

              <Form {...disableForm}>
                <form className="space-y-3" onSubmit={disableForm.handleSubmit(handleDisable)}>
                  <FormField
                    control={disableForm.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <Field>
                          <FieldLabel>Current password</FieldLabel>
                          <FormControl>
                            <Input
                              autoComplete="current-password"
                              placeholder="Current password"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FieldDescription>
                            Required to disable two-factor authentication.
                          </FieldDescription>
                          <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                        </Field>
                      </FormItem>
                    )}
                  />

                  <Button
                    loading={disableForm.formState.isSubmitting}
                    size="sm"
                    type="submit"
                    variant="destructive"
                  >
                    Disable 2FA
                  </Button>
                </form>
              </Form>
            </>
          ) : (
            <Form {...enableForm}>
              <form className="space-y-3" onSubmit={enableForm.handleSubmit(handleEnable)}>
                <FormField
                  control={enableForm.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Current password</FieldLabel>
                        <FormControl>
                          <Input
                            autoComplete="current-password"
                            placeholder="Current password"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FieldDescription>
                          Confirm your password before starting setup.
                        </FieldDescription>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />

                <Button loading={enableForm.formState.isSubmitting} size="sm" type="submit">
                  <ShieldCheckIcon className="size-4" />
                  Start setup
                </Button>
              </form>
            </Form>
          )}
        </CardPanel>
      </Card>

      <Dialog onOpenChange={resetTwoFactorDialog} open={setupDialogOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Set up two-factor authentication</DialogTitle>
            <DialogDescription>
              Scan this code with your authenticator app, then enter the 6-digit verification code.
            </DialogDescription>
          </DialogHeader>
          {totpUri ? (
            <>
              <DialogPanel className="space-y-4">
                <div className="mx-auto w-full max-w-52 border bg-background p-3">
                  <QRCode className="aspect-square w-full" data={totpUri} robustness="H" />
                </div>

                <div className="flex justify-center">
                  <Button
                    className="px-0"
                    onClick={() => void copyText(totpUri, "Setup URI copied")}
                    size="sm"
                    type="button"
                    variant="link"
                  >
                    <CopyIcon className="size-4" />
                    Copy setup URI
                  </Button>
                </div>

                <p className="text-xs break-all text-muted-foreground">{totpUri}</p>

                {backupCodes.length > 0 ? (
                  <div className="space-y-2 border bg-muted/40 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">Backup codes</p>
                      <Button
                        className="px-0"
                        onClick={() => void copyText(backupCodes.join("\n"), "Backup codes copied")}
                        size="sm"
                        type="button"
                        variant="link"
                      >
                        <CopyIcon className="size-4" />
                        Copy
                      </Button>
                    </div>
                    <pre className="text-xs break-all whitespace-pre-wrap text-muted-foreground">
                      {backupCodes.join("\n")}
                    </pre>
                  </div>
                ) : null}

                <Form {...verifyForm}>
                  <form className="space-y-3" onSubmit={verifyForm.handleSubmit(handleVerify)}>
                    <FormField
                      control={verifyForm.control}
                      name="code"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <Field>
                            <FieldLabel>Verification code</FieldLabel>
                            <FormControl>
                              <Input
                                autoComplete="one-time-code"
                                inputMode="numeric"
                                placeholder="123456"
                                {...field}
                              />
                            </FormControl>
                            <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                          </Field>
                        </FormItem>
                      )}
                    />

                    <Button loading={verifyForm.formState.isSubmitting} size="sm" type="submit">
                      Enable 2FA
                    </Button>
                  </form>
                </Form>
              </DialogPanel>
              <DialogFooter>
                <Button onClick={() => resetTwoFactorDialog(false)} type="button" variant="outline">
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogPopup>
      </Dialog>
    </>
  );
}

function SecurityChangePassword() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: accounts } = useSuspenseQuery(trpc.profile.listAccounts.queryOptions());
  const hasPasswordAccount = accounts.some((account) => account.providerId === "credential");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const changePassword = useMutation({
    ...trpc.profile.changePassword.mutationOptions({
      onSuccess: () => {
        toastManager.add({ title: "Password updated", type: "success" });
        void queryClient.invalidateQueries(trpc.profile.listAccounts.queryOptions());
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
                            onClick={() => setShowCurrent((state) => !state)}
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
                            onClick={() => setShowNew((state) => !state)}
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
                            onClick={() => setShowConfirm((state) => !state)}
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

function GoogleIcon() {
  return (
    <svg aria-hidden className="size-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
        fill="#0077B5"
      />
    </svg>
  );
}
