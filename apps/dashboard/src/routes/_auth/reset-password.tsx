import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@sycom/env/web";
import { Button } from "@sycom/ui/components/button";
import { buttonVariants } from "@sycom/ui/components/button-variants";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sycom/ui/components/input-group";
import { toastManager } from "@sycom/ui/components/toast";
import { cn } from "@sycom/ui/lib/utils";
import { createFileRoute, redirect, useRouter, useSearch } from "@tanstack/react-router";
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { Link } from "@/components/layout/foresight-link";
import { authClient } from "@/lib/auth/auth-client";
import { SESSION_QUERY_KEY } from "@/lib/auth/session";
import { useQueryClient } from "@tanstack/react-query";

const resetPasswordSearchSchema = z.object({
  token: z.optional(z.string()),
  error: z.optional(z.string()),
});

const resetPasswordSchema = z
  .object({
    password: z.string().check(z.minLength(8, "Password must be at least 8 characters")),
    confirmPassword: z.string(),
  })
  .check(
    z.refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),
  );

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const Route = createFileRoute("/_auth/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  beforeLoad: ({ search }) => {
    if (!search.token && !search.error) {
      throw redirect({ to: "/forgot-password" });
    }
  },
  head: () => ({
    meta: [
      { title: "Reset password | Sycom LMS" },
      {
        name: "description",
        content: "Choose a new password for your Sycom account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token, error } = useSearch({ from: "/_auth/reset-password" });

  if (error || !token) {
    return <ResetPasswordError />;
  }

  return <ResetPasswordForm token={token} />;
}

function ResetPasswordError() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full items-center justify-center">
        <div className="w-full space-y-5 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <AlertCircleIcon className="size-6 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-medium tracking-tight">This link is invalid</h1>
            <p className="text-sm text-muted-foreground">
              The reset link is invalid or has expired. Request a new one to continue.
            </p>
          </div>

          <Link className={buttonVariants({ variant: "outline" })} to="/forgot-password">
            Request a new link
          </Link>
        </div>
      </div>

      <div className="mt-auto pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Remembered your password?{" "}
          <Link className={cn(buttonVariants({ variant: "link" }), "px-0")} to="/sign-in">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });
      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }
      toastManager.add({
        title: "Password reset. Sign in with your new password.",
        type: "success",
      });
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      await router.navigate({ to: "/sign-in", replace: true });
    } catch (error) {
      if (error instanceof Error) {
        toastManager.add({
          title: error.message,
          type: "error",
        });
      } else {
        toastManager.add({
          title: "Couldn't reach server. Check your connection and try again.",
          type: "error",
        });
      }
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-full w-full items-center justify-center">
        <div className="w-full space-y-3">
          <div className="space-y-2 text-center">
            <h1 className="text-lg font-medium tracking-tight">Choose a new password</h1>
            <p className="text-sm text-muted-foreground">
              Pick something you haven&apos;t used before.
            </p>
          </div>

          <Form {...form} className="flex w-full flex-col gap-4">
            <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs text-muted-foreground">
                        New password
                      </FieldLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput
                            autoComplete="new-password"
                            placeholder="Min. 8 characters"
                            type={showPassword ? "text" : "password"}
                            {...field}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              onClick={() => setShowPassword((s) => !s)}
                            >
                              {showPassword ? (
                                <EyeOffIcon className="size-3.5" />
                              ) : (
                                <EyeIcon className="size-3.5" />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FieldError reserveSpace>
                        {fieldState.error?.message ?? (
                          <span className="text-muted-foreground/70">
                            Tip: mix uppercase, lowercase, and a number for a stronger password.
                          </span>
                        )}
                      </FieldError>
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
                      <FieldLabel className="text-xs text-muted-foreground">
                        Confirm password
                      </FieldLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput
                            autoComplete="new-password"
                            placeholder="Re-enter password"
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

              <Button
                className="mt-1 w-full"
                loading={form.formState.isSubmitting}
                size="lg"
                type="submit"
              >
                Reset password
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link className={cn(buttonVariants({ variant: "link" }), "px-0")} to="/sign-in">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-auto pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a
            className={cn(
              buttonVariants({ variant: "link" }),
              "px-0 text-muted-foreground transition-colors hover:text-foreground",
            )}
            href={`${env.VITE_WEBSITE_URL}/terms`}
          >
            Terms of Service
          </a>{" "}
          &amp;{" "}
          <a
            className={cn(
              buttonVariants({ variant: "link" }),
              "px-0 text-muted-foreground transition-colors hover:text-foreground",
            )}
            href={`${env.VITE_WEBSITE_URL}/privacy`}
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
