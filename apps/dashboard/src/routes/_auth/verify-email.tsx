import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@sycom/env/web";
import { Button } from "@sycom/ui/components/button";
import { buttonVariants } from "@sycom/ui/components/button-variants";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import { toastManager } from "@sycom/ui/components/toast";
import { cn } from "@sycom/ui/lib/utils";
import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Link } from "@/components/layout/foresight-link";
import { authClient } from "@/lib/auth/auth-client";

const verifyEmailErrorEnum = z.enum(["token_expired", "invalid_token", "unknown"]);

const verifyEmailSearchSchema = z.object({
  error: verifyEmailErrorEnum.optional(),
});

const resendSchema = z.object({
  email: z.email("Invalid email address"),
});
type ResendInput = z.infer<typeof resendSchema>;

export const Route = createFileRoute("/_auth/verify-email")({
  validateSearch: verifyEmailSearchSchema,
  head: () => ({
    meta: [
      { title: "Verification problem | Sycom LMS" },
      {
        name: "description",
        content: "Resend your Sycom verification email.",
      },
    ],
  }),
  component: VerifyEmailPage,
});

type VerifyEmailErrorKey = z.infer<typeof verifyEmailErrorEnum>;

const errorCopy: Record<VerifyEmailErrorKey, { title: string; body: string }> = {
  token_expired: {
    title: "This link expired",
    body: "Verification links expire after 24 hours. Enter your email and we'll send a fresh one.",
  },
  invalid_token: {
    title: "This link isn't valid",
    body: "The link may have been used already or was copied incorrectly. Enter your email to resend.",
  },
  unknown: {
    title: "We couldn't verify that link",
    body: "Something went wrong on our end. Enter your email and try again.",
  },
};

function verifyEmailErrorKey(value: unknown): VerifyEmailErrorKey {
  if (value === "token_expired" || value === "invalid_token" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function VerifyEmailPage() {
  const router = useRouter();
  const { error } = useSearch({ from: "/_auth/verify-email" });
  const copy = errorCopy[verifyEmailErrorKey(error)];

  const form = useForm<ResendInput>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ResendInput) => {
    try {
      const { error: sendError } = await authClient.sendVerificationEmail({
        email: data.email,
        callbackURL: `${env.VITE_DASHBOARD_URL}/dashboard`,
      });
      if (sendError) {
        toastManager.add({ title: sendError.message, type: "error" });
        return;
      }
      toastManager.add({ title: "Verification email sent", type: "success" });
      await router.navigate({
        to: "/check-email",
        search: { email: data.email },
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
        <div className="w-full space-y-5">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <TriangleAlertIcon className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-lg font-medium tracking-tight">{copy.title}</h1>
              <p className="text-sm text-muted-foreground">{copy.body}</p>
            </div>
          </div>

          <Form {...form}>
            <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs font-semibold text-muted-foreground">
                        Email address
                      </FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="email"
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
                Send fresh link
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <div className="mt-auto pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          <Link className={cn(buttonVariants({ variant: "link" }), "px-0")} to="/sign-in">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
