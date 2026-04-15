import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Input } from "../../src/components/input";
import { Label } from "../../src/components/label";

function Field({
  label,
  type = "text",
  placeholder,
  error,
  disabled,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

const meta = {
  title: "Composite/Field",
  component: Field,
  tags: ["autodocs"],
  args: {
    label: "Email",
    type: "email",
    placeholder: "you@example.com",
  },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    label: "Email",
    error: "Invalid email address",
  },
};

export const Password: Story = {
  args: {
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
  },
};

export const Disabled: Story = {
  args: {
    label: "Email",
    disabled: true,
    placeholder: "Disabled field",
  },
};

export const FormGroup: Story = {
  render: () => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate() {
      const next: Record<string, string> = {};
      const email = (document.getElementById("email") as HTMLInputElement)?.value;
      const password = (document.getElementById("password") as HTMLInputElement)?.value;

      if (!email) next.email = "Email is required";
      if (!password) next.password = "Password is required";
      else if (password.length < 8) next.password = "Password must be at least 8 characters";
      setErrors(next);
    }

    return (
      <form
        className="w-80 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          validate();
        }}
      >
        <Field label="Email" type="email" placeholder="you@example.com" error={errors.email} />
        <Field label="Password" type="password" error={errors.password} />
        <button
          type="submit"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Submit
        </button>
      </form>
    );
  },
};
