import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

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
import { toastManager } from "@sycom/ui/components/toast";
import { slugify } from "@sycom/ui/lib/string";
import { useState } from "react";

type CategoryRow = AppRouterOutputs["catalog"]["listCategories"]["rows"][number];

const categoryFormSchema = z.object({
  name: z.string().check(z.minLength(1, "Name is required"), z.maxLength(80)),
  slug: z
    .string()
    .check(
      z.minLength(2, "Slug must be at least 2 characters"),
      z.maxLength(60),
      z.regex(
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
        "Use lowercase letters, numbers, and hyphens only",
      ),
    ),
  order: z.string().check(z.maxLength(8)),
});

type CategoryFormInput = z.infer<typeof categoryFormSchema>;

const DEFAULT_VALUES: CategoryFormInput = {
  name: "",
  slug: "",
  order: "0",
};

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryRow;
};

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category
      ? { name: category.name, slug: category.slug, order: String(category.order) }
      : DEFAULT_VALUES,
  });

  useEffect(() => {
    form.reset(
      category
        ? { name: category.name, slug: category.slug, order: String(category.order) }
        : DEFAULT_VALUES,
    );
    setSlugTouched(false);
  }, [category, open, form]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.catalog.listCategories.queryKey() });

  const createMutation = useMutation({
    ...trpc.catalog.createCategory.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Category created", type: "success" });
        onOpenChange(false);
        await invalidate();
      },
      onError: (error) =>
        toastManager.add({
          title: "Couldn't create category",
          description: error.message,
          type: "error",
        }),
    }),
  });

  const updateMutation = useMutation({
    ...trpc.catalog.updateCategory.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Category updated", type: "success" });
        onOpenChange(false);
        await invalidate();
      },
      onError: (error) =>
        toastManager.add({
          title: "Couldn't update category",
          description: error.message,
          type: "error",
        }),
    }),
  });

  const isEditing = Boolean(category);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: CategoryFormInput) => {
    const orderNum = data.order.trim() === "" ? 0 : Number.parseInt(data.order, 10);
    if (Number.isNaN(orderNum) || orderNum < 0) {
      form.setError("order", { message: "Enter a non-negative whole number" });
      return;
    }

    if (category) {
      await updateMutation.mutateAsync({
        categoryId: category.id,
        patch: { name: data.name, slug: data.slug, order: orderNum },
      });
    } else {
      await createMutation.mutateAsync({ name: data.name, slug: data.slug, order: orderNum });
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            Categories tag the catalog so students can browse by topic.
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
                      <FieldLabel>Name</FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="Statistics"
                          {...field}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            field.onChange(value);
                            if (!slugTouched && !isEditing) {
                              form.setValue("slug", slugify(value), { shouldValidate: true });
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
                        <Input
                          autoComplete="off"
                          placeholder="statistics"
                          {...field}
                          onChange={(event) => {
                            setSlugTouched(true);
                            field.onChange(event.currentTarget.value);
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
                name="order"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Display order</FieldLabel>
                      <FormControl>
                        <Input autoComplete="off" inputMode="numeric" {...field} />
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <DialogFooter variant="bare">
                <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                  Cancel
                </Button>
                <Button loading={isPending} type="submit">
                  {isEditing ? "Save changes" : "Create category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
