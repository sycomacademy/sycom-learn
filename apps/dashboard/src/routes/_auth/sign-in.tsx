import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@sycom/env/web";
import { Button } from "@sycom/ui/components/button";
import { buttonVariants } from "@sycom/ui/components/button-variants";
import { Checkbox } from "@sycom/ui/components/checkbox";
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
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Link } from "@/components/layout/foresight-link";
import { authClient } from "@/lib/auth/auth-client";
import { resolvePostAuthRedirect } from "@/lib/auth/auth-redirect";
import { SESSION_QUERY_KEY, sessionQueryOptions } from "@/lib/auth/session";

const signInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type SignInInput = z.infer<typeof signInSchema>;

export const Route = createFileRoute("/_auth/sign-in")({
  head: () => ({
    meta: [
      {
        title: "Sign In | Sycom LMS",
      },
      {
        name: "description",
        content: "Sign in to your Sycom account or create a new one.",
      },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { redirect: redirectParam } = useSearch({ from: "/_auth" });
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: SignInInput) => {
    try {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      if (error) {
        if (error.code === "EMAIL_NOT_VERIFIED") {
          await authClient.sendVerificationEmail({
            email: data.email,
            callbackURL: `${env.VITE_DASHBOARD_URL}/dashboard`,
          });
          toastManager.add({
            title: "Please verify your email — we sent you a fresh link.",
            type: "info",
          });
          await router.navigate({
            to: "/check-email",
            search: { email: data.email },
            replace: true,
          });
          return;
        }
        toastManager.add({ title: error.message, type: "error" });
        return;
      }
      toastManager.add({ title: "Signed in", type: "success" });
      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
      await queryClient.prefetchQuery(sessionQueryOptions());
      const target = resolvePostAuthRedirect(router, redirectParam);
      await router.navigate({ href: target, replace: true });
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
            <h1 className="text-lg font-medium tracking-tight">Welcome to Sycom</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
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

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <div className="flex w-full items-center justify-between gap-2">
                        <FieldLabel className="text-xs text-muted-foreground">Password</FieldLabel>
                        <Link
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                          to="/forgot-password"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput
                            autoComplete="current-password"
                            placeholder="Enter your password"
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
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem>
                    <Field orientation="horizontal">
                      <Checkbox
                        checked={field.value}
                        id="rememberMe"
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      <FieldLabel
                        className="text-xs font-normal text-muted-foreground"
                        htmlFor="rememberMe"
                      >
                        Remember me
                      </FieldLabel>
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
                Continue
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link className={cn(buttonVariants({ variant: "link" }), "px-0")} to="/sign-up">
              Create account
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-auto pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          By signing in you agree to our{" "}
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
