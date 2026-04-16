import { Button, buttonVariants } from "@sycom/ui/components/button";
import { Checkbox } from "@sycom/ui/components/checkbox";
import { Input } from "@sycom/ui/components/input";
import { Label } from "@sycom/ui/components/label";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

const signInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

export default function SignInForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
          rememberMe: value.rememberMe,
        },
        {
          onSuccess: async () => {
            toast.success("Signed in");
            await queryClient.invalidateQueries({ queryKey: ["session"] });
            await router.invalidate();
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText || "Something went wrong");
          },
        },
      );
    },
    validators: {
      onSubmit: signInSchema,
    },
  });

  return (
    <div className="w-full space-y-3">
      <div className="space-y-2 text-center">
        <h1 className="text-lg font-medium tracking-tight">Welcome to Sycom</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground" htmlFor={field.name}>
                Email address
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                autoComplete="username"
                id={field.name}
                name={field.name}
                placeholder="you@example.com"
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <p className="min-h-4 text-xs text-destructive">
                {field.state.meta.errors.map((err) => err?.message).filter(Boolean)[0] ?? ""}
              </p>
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground" htmlFor={field.name}>
                  Password
                </Label>
                <Link
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  to="/forgot-password"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  aria-invalid={field.state.meta.errors.length > 0}
                  autoComplete="current-password"
                  className="pr-10"
                  id={field.name}
                  name={field.name}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-3.5" />
                  ) : (
                    <EyeIcon className="size-3.5" />
                  )}
                </Button>
              </div>
              <p className="min-h-4 text-xs text-destructive">
                {field.state.meta.errors.map((err) => err?.message).filter(Boolean)[0] ?? ""}
              </p>
            </div>
          )}
        </form.Field>

        <form.Field name="rememberMe">
          {(field) => (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={field.state.value}
                id="rememberMe"
                onCheckedChange={(checked) => field.handleChange(checked === true)}
              />
              <Label className="text-xs font-normal text-muted-foreground" htmlFor="rememberMe">
                Remember me
              </Label>
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button className="mt-1 w-full" disabled={!canSubmit || isSubmitting} type="submit">
              {isSubmitting ? <Loader2 aria-hidden className="mr-2 size-4 animate-spin" /> : null}
              Continue
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link className={buttonVariants({ className: "px-0", variant: "link" })} to="/sign-up">
          Create account
        </Link>
      </p>
    </div>
  );
}
