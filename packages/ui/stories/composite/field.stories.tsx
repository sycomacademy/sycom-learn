import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Field, FieldError, FieldLabel } from "../../src/components/field";
import { Form, FormControl, FormField, FormItem } from "../../src/components/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../src/components/input-group";
import { Input } from "../../src/components/input";

const emailSchema = z.object({
  email: z.email("Invalid email address"),
});
type EmailInput = z.infer<typeof emailSchema>;

function EmailFieldStory({
  label = "Email address",
  placeholder = "you@example.com",
  defaultValue = "",
  disabled = false,
  triggerOnMount = false,
}: {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  triggerOnMount?: boolean;
}) {
  const form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: defaultValue },
    mode: "onBlur",
  });

  useEffect(() => {
    if (triggerOnMount) void form.trigger();
  }, [form, triggerOnMount]);

  return (
    <Form {...form}>
      <div className="w-80">
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field>
                <FieldLabel className="text-xs font-semibold text-muted-foreground">
                  {label}
                </FieldLabel>
                <FormControl>
                  <Input
                    autoComplete="email"
                    disabled={disabled}
                    placeholder={placeholder}
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
              </Field>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

const meta = {
  title: "Composite/Field",
  component: EmailFieldStory,
  tags: ["autodocs"],
  args: {
    label: "Email address",
    placeholder: "you@example.com",
  },
} satisfies Meta<typeof EmailFieldStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    defaultValue: "not-an-email",
    triggerOnMount: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled field",
  },
};

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type PasswordInput = z.infer<typeof passwordSchema>;

function PasswordFieldStory() {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
    mode: "onBlur",
  });

  return (
    <Form {...form}>
      <div className="w-80">
        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field>
                <FieldLabel className="text-xs font-semibold text-muted-foreground">
                  Password
                </FieldLabel>
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
      </div>
    </Form>
  );
}

export const Password: Story = {
  render: () => <PasswordFieldStory />,
};

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type LoginInput = z.infer<typeof loginSchema>;

function FormGroupStory() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  return (
    <Form {...form}>
      <div className="flex w-80 flex-col gap-3">
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
                <FieldLabel className="text-xs font-semibold text-muted-foreground">
                  Password
                </FieldLabel>
                <FormControl>
                  <Input
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
              </Field>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

export const FormGroup: Story = {
  render: () => <FormGroupStory />,
};
