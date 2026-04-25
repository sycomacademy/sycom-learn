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
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

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

export function SecurityChangePassword({ hasPasswordAccount }: { hasPasswordAccount: boolean }) {
  const trpcClient = useTRPCClient();
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
