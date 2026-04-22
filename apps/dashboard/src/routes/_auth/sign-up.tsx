import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@sycom/env/web";
import { Button } from "@sycom/ui/components/button";
import { buttonVariants } from "@sycom/ui/components/button-variants";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sycom/ui/components/input-group";
import { toastManager } from "@sycom/ui/components/toast";
import { cn } from "@sycom/ui/lib/utils";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Link } from "@/components/layout/foresight-link";
import { authClient } from "@/lib/auth/auth-client";

const signUpSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(3, "First name must be at least 3 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(3, "Last name must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpInput = z.infer<typeof signUpSchema>;

export const Route = createFileRoute("/_auth/sign-up")({
  head: () => ({
    meta: [
      {
        title: "Create account | Sycom LMS",
      },
      {
        name: "description",
        content: "Create your Sycom account to get started.",
      },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignUpInput) => {
    try {
      const { error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        callbackURL: `${env.VITE_DASHBOARD_URL}/dashboard`,
      });
      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }
      toastManager.add({ title: "Check your email to verify your account", type: "success" });
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
        <div className="w-full space-y-3">
          <div className="space-y-2 text-center">
            <h1 className="text-lg font-medium tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground">Get started with Sycom</p>
          </div>

          <Form {...form} className="flex w-full flex-col gap-4">
            <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel className="text-xs text-muted-foreground">
                          First name
                        </FieldLabel>
                        <FormControl>
                          <Input autoComplete="given-name" placeholder="Ada" {...field} />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel className="text-xs text-muted-foreground">Last name</FieldLabel>
                        <FormControl>
                          <Input autoComplete="family-name" placeholder="Lovelace" {...field} />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs text-muted-foreground">Password</FieldLabel>
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

              <Button
                className="mt-1 w-full"
                loading={form.formState.isSubmitting}
                size="lg"
                type="submit"
              >
                Create account
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className={cn(buttonVariants({ variant: "link" }), "px-0")} to="/sign-in">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-auto pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
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
