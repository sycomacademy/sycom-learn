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
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@sycom/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sycom/ui/components/input-group";
import { toastManager } from "@sycom/ui/components/toast";
import { createFileRoute } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { useUser } from "@/hooks/use-user";
import { useTRPCClient } from "@/lib/trpc/client";

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

export const Route = createFileRoute("/dashboard/settings/security")({
  loader: async ({ context }) => {
    const accounts = await context.queryClient.ensureQueryData(
      context.trpc.profile.listAccounts.queryOptions(),
    );
    return {
      hasPasswordAccount: accounts.some((account) => account.providerId === "credential"),
    };
  },
  component: SecuritySettings,
});

function SecuritySettings() {
  const { hasPasswordAccount } = Route.useLoaderData();
  const { session } = useUser();

  return (
    <div className="space-y-4">
      <CurrentSessionCard session={session} />
      <ChangePasswordCard hasPasswordAccount={hasPasswordAccount} />
    </div>
  );
}

type Session = ReturnType<typeof useUser>["session"];

function CurrentSessionCard({ session }: { session: Session }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Current session</CardTitle>
        <CardDescription className="text-sm">
          You're signed in on this device. Sign out to end this session.
        </CardDescription>
      </CardHeader>
      <CardPanel className="space-y-2 py-0 text-sm">
        <Row label="Started" value={formatDateTime(session.createdAt)} />
        <Row label="Expires" value={formatDateTime(session.expiresAt)} />
        <Row label="IP address" value={session.ipAddress ?? "—"} />
        <Row label="Device" value={parseUserAgent(session.userAgent)} />
      </CardPanel>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function parseUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";
  const match = userAgent.match(/\(([^)]+)\)/);
  return match?.[1] ?? userAgent;
}

function ChangePasswordCard({ hasPasswordAccount }: { hasPasswordAccount: boolean }) {
  const trpcClient = useTRPCClient();
  const [open, setOpen] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      await trpcClient.profile.changePassword.mutate({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: false,
      });
      toastManager.add({ title: "Password updated", type: "success" });
      form.reset();
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't reach server. Check your connection and try again.";
      toastManager.add({
        title: "Couldn't change password",
        description: message,
        type: "error",
      });
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset();
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Password</CardTitle>
        <CardDescription className="text-sm">
          {hasPasswordAccount
            ? "Use a password unique to Sycom — at least 8 characters."
            : "You signed in with an external provider. Use the password reset flow if you'd like to set a Sycom password."}
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-end">
        <Button className="w-40" onClick={() => setOpen(true)} type="button" variant="outline">
          Change password
        </Button>
      </CardFooter>

      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter your current password to confirm, then choose a new one.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
              <DialogPanel className="space-y-4">
                {!hasPasswordAccount && (
                  <p className="text-sm text-muted-foreground">
                    Password change isn't available because you signed in with an external provider.
                  </p>
                )}
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
                              type={showCurrent ? "text" : "password"}
                              {...field}
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupButton
                                aria-label={showCurrent ? "Hide password" : "Show password"}
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
                              type={showNew ? "text" : "password"}
                              {...field}
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupButton
                                aria-label={showNew ? "Hide password" : "Show password"}
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
                              type={showConfirm ? "text" : "password"}
                              {...field}
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupButton
                                aria-label={showConfirm ? "Hide password" : "Show password"}
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
              </DialogPanel>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button
                  disabled={!hasPasswordAccount}
                  loading={form.formState.isSubmitting}
                  type="submit"
                >
                  Change password
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogPopup>
      </Dialog>
    </Card>
  );
}
