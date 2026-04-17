import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@sycom/ui/components/button";
import { Checkbox } from "@sycom/ui/components/checkbox";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sycom/ui/components/input-group";
import { Input } from "@sycom/ui/components/input";
import { Spinner } from "@sycom/ui/components/spinner";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearch } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { ForesightLink } from "@/components/foresight-link";
import { authClient } from "@/lib/auth-client";
import { resolvePostAuthRedirect } from "@/lib/post-auth-redirect";

const signInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

type SignInInput = z.infer<typeof signInSchema>;

export default function SignInForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { redirect: redirectParam } = useSearch({ from: "/_auth" });
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: SignInInput) => {
    await authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      },
      {
        onSuccess: async () => {
          toast.success("Signed in");
          await queryClient.invalidateQueries({ queryKey: ["session"] });
          const target = resolvePostAuthRedirect(router, redirectParam);
          await router.navigate({ href: target, replace: true });
        },
        onError: (error) => {
          toast.error(error.error.message || error.error.statusText || "Something went wrong");
        },
      },
    );
  };

  return (
    <div className="w-full space-y-3">
      <div className="space-y-2 text-center">
        <h1 className="text-lg font-medium tracking-tight">Welcome to Sycom</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      <Form {...form}>
        <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel className="text-xs text-muted-foreground">Email address</FieldLabel>
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
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel className="text-xs text-muted-foreground">Password</FieldLabel>
                    <ForesightLink
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      to="/forgot-password"
                    >
                      Forgot password?
                    </ForesightLink>
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

          <Button className="mt-1 w-full" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? <Spinner className="mr-2" /> : null}
            Continue
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <ForesightLink
          className={buttonVariants({ className: "px-0", variant: "link" })}
          to="/sign-up"
        >
          Create account
        </ForesightLink>
      </p>
    </div>
  );
}
