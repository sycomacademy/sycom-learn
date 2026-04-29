import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@sycom/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Textarea } from "@sycom/ui/components/textarea";
import { toastManager } from "@sycom/ui/components/toast";

const RESERVED_SLUGS = ["admin", "api", "app", "auth", "dashboard", "public", "www"] as const;

const createOrganizationSchema = z.object({
  name: z.string().check(z.minLength(1, "Organization name is required"), z.maxLength(120)),
  slug: z.string().check(
    z.minLength(2, "Slug must be at least 2 characters"),
    z.maxLength(63, "Slug must be at most 63 characters"),
    z.regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "Use lowercase letters, numbers, and hyphens only",
    ),
    z.refine((value) => !value.includes("--"), "No consecutive hyphens"),
    z.refine(
      (value) => !RESERVED_SLUGS.includes(value as (typeof RESERVED_SLUGS)[number]),
      "This slug is reserved",
    ),
  ),
  primaryDomain: z.optional(
    z.string().check(
      z.maxLength(253),
      z.refine(
        (value) =>
          value.length === 0 ||
          /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(value),
        "Enter a valid domain like example.com",
      ),
    ),
  ),
  supportEmail: z.optional(
    z
      .string()
      .check(
        z.refine(
          (value) => value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          "Enter a valid email",
        ),
      ),
  ),
  ownerFirstName: z.string().check(z.minLength(1, "Owner first name is required"), z.maxLength(80)),
  ownerLastName: z.string().check(z.minLength(1, "Owner last name is required"), z.maxLength(80)),
  ownerEmail: z.email("Enter a valid email"),
  internalNotes: z.optional(z.string().check(z.maxLength(2000))),
});

type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

const DEFAULT_VALUES: CreateOrganizationInput = {
  name: "",
  slug: "",
  primaryDomain: "",
  supportEmail: "",
  ownerFirstName: "",
  ownerLastName: "",
  ownerEmail: "",
  internalNotes: "",
};

function slugifyName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 63);
}

type CreateOrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateOrganizationDialog({ open, onOpenChange }: CreateOrganizationDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listOrgsQueryKey = trpc.admin.listOrganizations.queryKey();
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const createMutation = useMutation({
    ...trpc.admin.createOrganization.mutationOptions({
      onSuccess: async (data, input) => {
        toastManager.add({
          title: "Organization created",
          description:
            data.owner.kind === "existing"
              ? `${input.name} is live and ${input.ownerEmail} is now the owner.`
              : `${input.name} is live. ${input.ownerEmail} has been invited as owner.`,
          type: "success",
        });
        onOpenChange(false);
        form.reset(DEFAULT_VALUES);
        setSlugTouched(false);
        await queryClient.invalidateQueries({ queryKey: listOrgsQueryKey });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't create organization",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const onSubmit = async (data: CreateOrganizationInput) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        slug: data.slug,
        ownerFirstName: data.ownerFirstName,
        ownerLastName: data.ownerLastName,
        ownerEmail: data.ownerEmail,
        primaryDomain: data.primaryDomain?.trim() ? data.primaryDomain.trim() : undefined,
        supportEmail: data.supportEmail?.trim() ? data.supportEmail.trim() : undefined,
        internalNotes: data.internalNotes?.trim() ? data.internalNotes.trim() : undefined,
      });
    } catch {
      // onError toast already fired by mutation
    }
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      form.reset(DEFAULT_VALUES);
      setSlugTouched(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogPopup className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Spin up a new tenant and assign a primary contact who becomes the organization owner.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Organization name</FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="Ordal Academy"
                          {...field}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            field.onChange(value);
                            if (!slugTouched) {
                              form.setValue("slug", slugifyName(value), {
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
                name="slug"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Slug</FieldLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput
                            autoComplete="off"
                            placeholder="ordal"
                            {...field}
                            onChange={(event) => {
                              setSlugTouched(true);
                              field.onChange(event.currentTarget.value);
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <span className="text-xs text-muted-foreground">.app.sycom.com</span>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primaryDomain"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Primary email domain</FieldLabel>
                        <FormControl>
                          <Input autoComplete="off" placeholder="ordal.com" {...field} />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supportEmail"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Support email</FieldLabel>
                        <FormControl>
                          <Input
                            autoComplete="off"
                            placeholder="support@ordal.com"
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ownerFirstName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Owner first name</FieldLabel>
                        <FormControl>
                          <Input autoComplete="off" placeholder="Ada" {...field} />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerLastName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Owner last name</FieldLabel>
                        <FormControl>
                          <Input autoComplete="off" placeholder="Lovelace" {...field} />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Owner email</FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="ada@ordal.com"
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
                name="internalNotes"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Internal notes</FieldLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Anything Sycom staff should know about this tenant."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <DialogFooter variant="bare">
                <Button onClick={() => handleOpenChange(false)} type="button" variant="outline">
                  Cancel
                </Button>
                <Button loading={form.formState.isSubmitting} type="submit">
                  Create organization
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
