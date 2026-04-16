import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@sycom/ui/components/button";
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
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { resolvePostAuthRedirect } from "@/lib/post-auth-redirect";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpInput = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { redirect: redirectParam } = useSearch({ from: "/_auth" });
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignUpInput) => {
    await authClient.signUp.email(
      {
        email: data.email,
        password: data.password,
        name: data.name,
      },
      {
        onSuccess: async () => {
          toast.success("Account created");
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
        <h1 className="text-lg font-medium tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">Get started with Sycom</p>
      </div>

      <Form {...form}>
        <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel className="text-xs text-muted-foreground">Name</FieldLabel>
                  <FormControl>
                    <Input autoComplete="name" placeholder="Your name" {...field} />
                  </FormControl>
                  <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                </Field>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel className="text-xs text-muted-foreground">Email address</FieldLabel>
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
                        placeholder="Choose a password"
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

          <Button className="mt-1 w-full" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? <Spinner className="mr-2" /> : null}
            Continue
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className={buttonVariants({ className: "px-0", variant: "link" })} to="/sign-in">
          Sign in
        </Link>
      </p>
    </div>
  );
}
