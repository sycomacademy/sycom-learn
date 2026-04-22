import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@sycom/ui/components/autocomplete";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormField, FormItem } from "@sycom/ui/components/form";

const CITIES = ["Amsterdam", "Berlin", "Copenhagen", "Dublin", "Edinburgh", "Frankfurt"] as const;

const citySchema = z.object({
  city: z.string().min(2, "Choose or type a city"),
});
type CityInput = z.infer<typeof citySchema>;

function AutocompleteFieldStory({
  defaultValue = "",
  disabled = false,
  triggerOnMount = false,
}: {
  defaultValue?: string;
  disabled?: boolean;
  triggerOnMount?: boolean;
}) {
  const form = useForm<CityInput>({
    resolver: zodResolver(citySchema),
    defaultValues: { city: defaultValue },
    mode: "onChange",
  });

  useEffect(() => {
    if (triggerOnMount) void form.trigger();
  }, [form, triggerOnMount]);

  return (
    <Form {...form} className="flex w-full max-w-80 flex-col gap-4">
      <FormField
        control={form.control}
        name="city"
        render={({ field, fieldState }) => (
          <FormItem>
            <Field invalid={!!fieldState.error}>
              <FieldLabel className="text-xs font-semibold text-muted-foreground">City</FieldLabel>
              <Autocomplete
                disabled={disabled}
                items={[...CITIES]}
                onValueChange={field.onChange}
                value={field.value}
              >
                <AutocompleteInput
                  aria-invalid={!!fieldState.error}
                  placeholder="Start typing…"
                  showTrigger
                />
                <AutocompletePopup>
                  <AutocompleteList>
                    {(item: string) => (
                      <AutocompleteItem key={item} value={item}>
                        {item}
                      </AutocompleteItem>
                    )}
                  </AutocompleteList>
                </AutocompletePopup>
              </Autocomplete>
              <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
            </Field>
          </FormItem>
        )}
      />
    </Form>
  );
}

const meta = {
  title: "Composite/Autocomplete Field",
  component: AutocompleteFieldStory,
  tags: ["autodocs"],
} satisfies Meta<typeof AutocompleteFieldStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: "Berlin",
  },
};

export const WithError: Story = {
  args: {
    defaultValue: "",
    triggerOnMount: true,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: "Dublin",
    disabled: true,
  },
};
