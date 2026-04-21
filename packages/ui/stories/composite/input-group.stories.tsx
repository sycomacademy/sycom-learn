import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EyeIcon, EyeOffIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@sycom/ui/components/input-group";

const siteSchema = z.object({
  site: z
    .string()
    .min(1, "Enter a hostname")
    .refine((s) => {
      try {
        new URL(`https://${s}`);
        return true;
      } catch {
        return false;
      }
    }, "Enter a valid hostname"),
});
type SiteInput = z.infer<typeof siteSchema>;

function UrlFieldStory({
  defaultValue = "https://example.com",
  disabled = false,
  triggerOnMount = false,
}: {
  defaultValue?: string;
  disabled?: boolean;
  triggerOnMount?: boolean;
}) {
  const form = useForm<SiteInput>({
    resolver: zodResolver(siteSchema),
    defaultValues: { site: defaultValue.replace(/^https?:\/\//, "") },
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
          name="site"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field>
                <FieldLabel className="text-xs font-semibold text-muted-foreground">
                  Website
                </FieldLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <InputGroupText>https://</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      autoComplete="url"
                      disabled={disabled}
                      inputMode="url"
                      placeholder="example.com"
                      type="text"
                      {...field}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton aria-label="Search" type="button">
                        <SearchIcon className="size-3.5" />
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

function PasswordToggleStory() {
  const [show, setShow] = useState(false);

  return (
    <div className="w-80">
      <InputGroup>
        <InputGroupInput
          autoComplete="current-password"
          placeholder="Password"
          type={show ? "text" : "password"}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((s) => !s)}
          >
            {show ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

const meta = {
  title: "Composite/Input Group",
  component: UrlFieldStory,
  tags: ["autodocs"],
} satisfies Meta<typeof UrlFieldStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    defaultValue: "not-a-url",
    triggerOnMount: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "https://example.com",
  },
};

export const PasswordToggle: Story = {
  render: () => <PasswordToggleStory />,
};
