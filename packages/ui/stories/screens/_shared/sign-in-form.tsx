import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Button } from "../../../src/components/button";
import { buttonVariants } from "../../../src/components/button-variants";
import { Checkbox } from "../../../src/components/checkbox";
import { Field, FieldError, FieldLabel } from "../../../src/components/field";
import { Form, FormControl, FormField, FormItem } from "../../../src/components/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../../src/components/input-group";
import { Input } from "../../../src/components/input";
import { toastManager } from "../../../src/components/toast";
import { cn } from "../../../src/lib/utils";

const signInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type SignInInput = z.infer<typeof signInSchema>;

export function SignInForm({
  onSubmit: onSubmitProp,
}: {
  onSubmit?: (values: SignInInput) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: SignInInput) => {
    try {
      await new Promise((r) => setTimeout(r, 600));
      onSubmitProp?.(data);
      toastManager.add({ title: "Signed in", type: "success" });
    } catch (error) {
      if (error instanceof Error) {
        toastManager.add({ title: error.message, type: "error" });
      } else {
        toastManager.add({
          title: "Couldn't reach server. Check your connection and try again.",
          type: "error",
        });
      }
    }
  };

  return (
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
                  <FieldLabel className="text-xs font-semibold text-muted-foreground">
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
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel className="text-xs font-semibold text-muted-foreground">
                      Password
                    </FieldLabel>
                    <a
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      href="#forgot-password"
                    >
                      Forgot password?
                    </a>
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
        <a className={cn(buttonVariants({ variant: "link" }), "px-0")} href="#sign-up">
          Create account
        </a>
      </p>
    </div>
  );
}
