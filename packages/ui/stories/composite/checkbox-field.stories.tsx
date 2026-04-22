import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import z from "zod";

import { Checkbox } from "../../src/components/checkbox";
import { Field, FieldError, FieldLabel } from "../../src/components/field";
import { Form, FormField, FormItem } from "../../src/components/form";

const singleSchema = z.object({
  accept: z.boolean().refine((v) => v === true, "You must accept to continue"),
});
type SingleInput = z.infer<typeof singleSchema>;

function CheckboxFieldStory({
  label = "Accept terms and conditions",
  description = "You agree to our Terms of Service and Privacy Policy.",
  defaultChecked = false,
  disabled = false,
}: {
  label?: string;
  description?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  const form = useForm<SingleInput>({
    resolver: zodResolver(singleSchema),
    defaultValues: { accept: defaultChecked },
    mode: "onChange",
  });

  return (
    <Form {...form} className="flex w-full max-w-80 flex-col gap-4">
      <FormField
        control={form.control}
        name="accept"
        render={({ field, fieldState }) => (
          <FormItem>
            <Field orientation="horizontal">
              <Checkbox
                checked={field.value}
                disabled={disabled}
                id="accept"
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <div className="grid gap-1 leading-none">
                <FieldLabel className="text-xs font-semibold" htmlFor="accept">
                  {label}
                </FieldLabel>
                {description ? (
                  <p className="text-xs text-muted-foreground">{description}</p>
                ) : null}
              </div>
            </Field>
            <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
          </FormItem>
        )}
      />
    </Form>
  );
}

const meta = {
  title: "Composite/Checkbox Field",
  component: CheckboxFieldStory,
  tags: ["autodocs"],
  args: {
    label: "Accept terms and conditions",
    description: "You agree to our Terms of Service and Privacy Policy.",
  },
} satisfies Meta<typeof CheckboxFieldStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    label: "Remember me",
    description: undefined,
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled option",
    description: "This option cannot be changed.",
    disabled: true,
  },
};

const prefsSchema = z.object({
  notifications: z.boolean(),
  marketing: z.boolean(),
  security: z.boolean(),
});
type PrefsInput = z.infer<typeof prefsSchema>;

function PrefsListStory() {
  const form = useForm<PrefsInput>({
    resolver: zodResolver(prefsSchema),
    defaultValues: { notifications: false, marketing: false, security: true },
    mode: "onChange",
  });

  const items: { name: keyof PrefsInput; label: string; description: string }[] = [
    {
      name: "notifications",
      label: "Email notifications",
      description: "Receive email updates about your account.",
    },
    {
      name: "marketing",
      label: "Marketing emails",
      description: "Receive tips, product updates, and promotions.",
    },
    {
      name: "security",
      label: "Security alerts",
      description: "Get notified about unusual account activity.",
    },
  ];

  return (
    <Form {...form} className="flex w-full max-w-96 flex-col gap-4">
      {items.map((item) => (
        <FormField
          key={item.name}
          control={form.control}
          name={item.name}
          render={({ field }) => (
            <FormItem>
              <Field orientation="horizontal">
                <Checkbox
                  checked={field.value}
                  id={item.name}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <div className="grid gap-1 leading-none">
                  <FieldLabel className="text-xs font-semibold" htmlFor={item.name}>
                    {item.label}
                  </FieldLabel>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </Field>
            </FormItem>
          )}
        />
      ))}
    </Form>
  );
}

export const List: Story = {
  render: () => <PrefsListStory />,
};
