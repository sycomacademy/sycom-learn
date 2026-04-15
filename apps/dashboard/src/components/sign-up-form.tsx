import { Button, buttonVariants } from "@sycom/ui/components/button";
import { Input } from "@sycom/ui/components/input";
import { Label } from "@sycom/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: async () => {
            toast.success("Account created");
            await router.invalidate();
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText || "Something went wrong");
          },
        },
      );
    },
    validators: {
      onSubmit: signUpSchema,
    },
  });

  return (
    <div className="w-full space-y-3">
      <div className="space-y-2 text-center">
        <h1 className="text-lg font-medium tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Get started with Sycom</p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground" htmlFor={field.name}>
                Name
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                autoComplete="name"
                id={field.name}
                name={field.name}
                placeholder="Your name"
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

        <form.Field name="email">
          {(field) => (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground" htmlFor={field.name}>
                Email address
              </Label>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                autoComplete="email"
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
              <Label className="text-xs text-muted-foreground" htmlFor={field.name}>
                Password
              </Label>
              <div className="relative">
                <Input
                  aria-invalid={field.state.meta.errors.length > 0}
                  autoComplete="new-password"
                  className="pr-10"
                  id={field.name}
                  name={field.name}
                  placeholder="Choose a password"
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
        Already have an account?{" "}
        <Link className={buttonVariants({ className: "px-0", variant: "link" })} to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
