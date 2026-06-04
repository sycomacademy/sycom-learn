import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod/mini";

import { useTRPC } from "@/lib/trpc/client";
import { slugify } from "@sycom/ui/lib/string";
import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@sycom/ui/components/card";
import { Checkbox } from "@sycom/ui/components/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import { toastManager } from "@sycom/ui/components/toast";

const fieldIdPattern = /^[a-z][a-z0-9_]{0,63}$/;

const fieldRowSchema = z.object({
  id: z
    .string()
    .check(z.regex(fieldIdPattern, "Use a lowercase slug (letters, numbers, underscores)")),
  label: z.string().check(z.minLength(1, "Label is required"), z.maxLength(120, "Too long")),
  type: z.enum(["text", "number"]),
  required: z.boolean(),
  placeholder: z.string(),
  idLocked: z.boolean(),
});

const settingsFormSchema = z.object({
  fields: z.array(fieldRowSchema).check(z.maxLength(50, "At most 50 fields")),
});

type SettingsFormInput = z.infer<typeof settingsFormSchema>;

function studentProfileFieldIdFromLabel(label: string): string {
  const slug = slugify(label)
    .replace(/-/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  if (!slug) return "";
  if (/^[a-z]/.test(slug)) return slug.slice(0, 64);
  return `field_${slug}`.slice(0, 64);
}

function uniqueFieldId(base: string, existingIds: Set<string>): string {
  if (!base) return base;
  if (!existingIds.has(base)) return base;
  let index = 2;
  while (existingIds.has(`${base}_${index}`) && index < 100) {
    index += 1;
  }
  return `${base}_${index}`;
}

export function OrgStudentProfileFieldSettings() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.organization.getStudentProfileFields.queryOptions());

  const updateFields = useMutation(
    trpc.organization.updateStudentProfileFields.mutationOptions({
      onSuccess: (result) => {
        form.reset({
          fields: result.fields.map((field) => ({
            ...field,
            required: field.required ?? false,
            placeholder: field.placeholder ?? "",
            idLocked: true,
          })),
        });
        toastManager.add({ title: "Student profile fields saved", type: "success" });
      },
    }),
  );

  const form = useForm<SettingsFormInput>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      fields: data.fields.map((field) => ({
        ...field,
        required: field.required ?? false,
        placeholder: field.placeholder ?? "",
        idLocked: true,
      })),
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  useEffect(() => {
    form.reset({
      fields: data.fields.map((field) => ({
        ...field,
        required: field.required ?? false,
        placeholder: field.placeholder ?? "",
        idLocked: true,
      })),
    });
  }, [data.fields, form]);

  const onSubmit = async (values: SettingsFormInput) => {
    try {
      await updateFields.mutateAsync({
        fields: values.fields.map((field, index) => ({
          id: field.id,
          label: field.label,
          type: field.type,
          required: field.required || undefined,
          placeholder: field.placeholder.trim() ? field.placeholder.trim() : undefined,
          order: index,
        })),
      });
    } catch {
      toastManager.add({
        title: "Couldn't save fields",
        description: "Check your connection and try again.",
        type: "error",
      });
    }
  };

  const addField = () => {
    append({
      id: "",
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      idLocked: false,
    });
  };

  return (
    <div className="space-y-4 px-6 pt-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Student profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define extra fields for students in this organization (for example matric or university
          ID). Only admins can view and edit values.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-sm">Profile fields</CardTitle>
                <CardDescription className="text-sm">
                  Removed fields stop appearing on member profiles; stored values are kept in the
                  database but hidden.
                </CardDescription>
              </div>
              <Button onClick={addField} size="sm" type="button" variant="outline">
                <PlusIcon className="size-4" />
                Add field
              </Button>
            </CardHeader>
            <CardPanel className="space-y-4 pb-6">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No custom fields yet. Add one to capture organization-specific student data.
                </p>
              ) : (
                fields.map((field, index) => (
                  <div className="space-y-4 rounded-lg border border-border p-4" key={field.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Field {index + 1}</p>
                      <div className="flex items-center gap-1">
                        <Button
                          aria-label="Move field up"
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <ChevronUpIcon className="size-4" />
                        </Button>
                        <Button
                          aria-label="Move field down"
                          disabled={index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <ChevronDownIcon className="size-4" />
                        </Button>
                        <Button
                          aria-label="Remove field"
                          onClick={() => remove(index)}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2Icon className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name={`fields.${index}.label`}
                      render={({ field: labelField, fieldState }) => (
                        <FormItem>
                          <Field>
                            <FieldLabel>Label</FieldLabel>
                            <FormControl>
                              <Input
                                {...labelField}
                                autoComplete="off"
                                onChange={(event) => {
                                  labelField.onChange(event);
                                  const locked = form.getValues(`fields.${index}.idLocked`);
                                  if (!locked) {
                                    const ids = new Set(
                                      form
                                        .getValues("fields")
                                        .map((row, rowIndex) =>
                                          rowIndex === index ? null : row.id,
                                        )
                                        .filter(Boolean) as string[],
                                    );
                                    const base = studentProfileFieldIdFromLabel(event.target.value);
                                    form.setValue(`fields.${index}.id`, uniqueFieldId(base, ids), {
                                      shouldValidate: true,
                                    });
                                  }
                                }}
                              />
                            </FormControl>
                            <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                          </Field>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`fields.${index}.id`}
                      render={({ field: idField, fieldState }) => {
                        const idLocked = form.watch(`fields.${index}.idLocked`);
                        return (
                          <FormItem>
                            <Field>
                              <FieldLabel>Field key</FieldLabel>
                              <FormControl>
                                <Input
                                  {...idField}
                                  aria-readOnly={idLocked}
                                  autoComplete="off"
                                  className="font-mono text-sm"
                                  disabled={idLocked}
                                  onBlur={() => {
                                    if (!idLocked && idField.value) {
                                      form.setValue(`fields.${index}.idLocked`, true);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FieldDescription>
                                Stable identifier stored with each member. Cannot be changed after
                                saving.
                              </FieldDescription>
                              <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                            </Field>
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name={`fields.${index}.type`}
                      render={({ field: typeField }) => (
                        <FormItem>
                          <Field>
                            <FieldLabel>Type</FieldLabel>
                            <Select
                              onValueChange={(value) => {
                                if (value === "text" || value === "number") {
                                  typeField.onChange(value);
                                }
                              }}
                              value={typeField.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`fields.${index}.placeholder`}
                      render={({ field: placeholderField }) => (
                        <FormItem>
                          <Field>
                            <FieldLabel>Placeholder (optional)</FieldLabel>
                            <FormControl>
                              <Input {...placeholderField} autoComplete="off" />
                            </FormControl>
                          </Field>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`fields.${index}.required`}
                      render={({ field: requiredField }) => (
                        <FormItem>
                          <Field orientation="horizontal">
                            <FormControl>
                              <Checkbox
                                checked={requiredField.value}
                                onCheckedChange={(checked) => {
                                  requiredField.onChange(checked === true);
                                }}
                              />
                            </FormControl>
                            <FieldLabel>Required for all students</FieldLabel>
                          </Field>
                        </FormItem>
                      )}
                    />
                  </div>
                ))
              )}
            </CardPanel>
            <CardFooter className="justify-end pt-0">
              <Button className="w-40" loading={form.formState.isSubmitting} type="submit">
                {form.formState.isSubmitting ? "Saving..." : "Save fields"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
