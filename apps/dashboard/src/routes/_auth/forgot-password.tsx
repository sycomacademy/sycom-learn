import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@sycom/env/web";
import { Button } from "@sycom/ui/components/button";
import { buttonVariants } from "@sycom/ui/components/button-variants";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import { toastManager } from "@sycom/ui/components/toast";
import { cn } from "@sycom/ui/lib/utils";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Link } from "@/components/layout/foresight-link";
import { authClient } from "@/lib/auth/auth-client";

const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const Route = createFileRoute("/_auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password | Sycom LMS" },
      {
        name: "description",
        content: "Reset your Sycom account password.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const router = useRouter();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      const { error } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${env.VITE_DASHBOARD_URL}/reset-password`,
      });
      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }
      await router.navigate({
        to: "/check-email",
        search: { email: data.email, flow: "reset" },
        replace: true,
      });
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
            <h1 className="text-lg font-medium tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a link to choose a new password.
            </p>
          </div>

          <Form {...form} className="flex w-full flex-col gap-4">
            <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs text-muted-foreground">
                        Email address
                      </FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="username"
                          placeholder="you@example.com"
                          type="email"
                          {...field}
                        />
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
                Send reset link
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
