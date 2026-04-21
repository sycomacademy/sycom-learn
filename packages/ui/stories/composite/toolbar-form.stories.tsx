import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterIcon, SearchIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";

import { buttonVariants } from "@sycom/ui/components/button-variants";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormField, FormItem } from "@sycom/ui/components/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@sycom/ui/components/input-group";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@sycom/ui/components/toolbar";
import { cn } from "@sycom/ui/lib/utils";

const toolbarBtn = (className?: string) =>
  cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-7 gap-1.5 px-2 sm:h-7", className);

const filterSchema = z.object({
  query: z.string().min(1, "Enter a search term"),
  role: z.enum(["all", "admin", "member"]),
});
type FilterInput = z.infer<typeof filterSchema>;

function ToolbarFormStory({ disabled = false }: { disabled?: boolean }) {
  const form = useForm<FilterInput>({
    resolver: zodResolver(filterSchema),
    defaultValues: { query: "", role: "all" },
    mode: "onChange",
  });

  return (
    <Form {...form}>
      <form
        className="w-full max-w-2xl"
        onSubmit={form.handleSubmit(() => {
          /* story only */
        })}
      >
        <Toolbar className="w-full flex-wrap">
          <ToolbarGroup className="min-w-0 flex-1">
            <FormField
              control={form.control}
              name="query"
              render={({ field, fieldState }) => (
                <FormItem className="min-w-0 flex-1 space-y-0">
                  <Field className="w-full min-w-0" invalid={!!fieldState.error}>
                    <span className="sr-only">
                      <FieldLabel>Search</FieldLabel>
                    </span>
                    <InputGroup className="min-w-0">
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>
                          <SearchIcon aria-hidden className="size-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        aria-invalid={!!fieldState.error}
                        autoComplete="off"
                        disabled={disabled}
                        placeholder="Search people…"
                        {...field}
                      />
                    </InputGroup>
                    <FieldError className="mt-1" reserveSpace>
                      {fieldState.error?.message}
                    </FieldError>
                  </Field>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <Field invalid={false}>
                    <span className="sr-only">
                      <FieldLabel>Role</FieldLabel>
                    </span>
                    <Select disabled={disabled} onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-36" size="sm">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectPopup>
                        <SelectItem value="all">All roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectPopup>
                    </Select>
                  </Field>
                </FormItem>
              )}
            />
          </ToolbarGroup>
          <ToolbarSeparator className="hidden min-h-6 sm:block" orientation="vertical" />
          <ToolbarGroup>
            <ToolbarButton className={toolbarBtn()} disabled={disabled} type="button">
              <FilterIcon className="size-3.5" />
              Filters
            </ToolbarButton>
            <ToolbarButton
              className={cn(buttonVariants({ size: "sm", variant: "default" }), "h-7 px-3")}
              disabled={disabled}
              type="submit"
            >
              Apply
            </ToolbarButton>
          </ToolbarGroup>
        </Toolbar>
      </form>
    </Form>
  );
}

const meta = {
  title: "Composite/Toolbar Form",
  component: ToolbarFormStory,
  tags: ["autodocs"],
} satisfies Meta<typeof ToolbarFormStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
