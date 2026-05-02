import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditIcon, Plus, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@sycom/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import { toastManager } from "@sycom/ui/components/toast";
import { slugify } from "@sycom/ui/lib/string";

import {
  categoryFormSchema,
  DEFAULT_CATEGORY_FORM_VALUES,
  getCategoryFormValues,
  type CategoryFormInput,
  type CategoryRow,
} from "./categories-schema";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@sycom/ui/components/alert-dialog";

function CategoryFormFields({
  form,
  isEditing,
  slugTouched,
  setSlugTouched,
}: {
  form: ReturnType<typeof useForm<CategoryFormInput>>;
  isEditing: boolean;
  slugTouched: boolean;
  setSlugTouched: (next: boolean) => void;
}) {
  return (
    <>
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
    </>
  );
}

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: DEFAULT_CATEGORY_FORM_VALUES,
  });

  const createMutation = useMutation({
    ...trpc.course.createCategory.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Category created", type: "success" });
        form.reset(DEFAULT_CATEGORY_FORM_VALUES);
        setSlugTouched(false);
        setOpen(false);
        await queryClient.invalidateQueries({ queryKey: trpc.course.listCategories.queryKey() });
      },
      onError: (error) =>
        toastManager.add({
          title: "Couldn't create category",
          description: error.message,
          type: "error",
        }),
    }),
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset(DEFAULT_CATEGORY_FORM_VALUES);
      setSlugTouched(false);
    }
  };

  const onSubmit = async (data: CategoryFormInput) => {
    const orderNum = data.order.trim() === "" ? 0 : Number.parseInt(data.order, 10);
    if (Number.isNaN(orderNum) || orderNum < 0) {
      form.setError("order", { message: "Enter a non-negative whole number" });
      return;
    }

    await createMutation.mutateAsync({ name: data.name, slug: data.slug, order: orderNum });
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            New category
          </Button>
        }
      />
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
          <DialogDescription>Categories help students browse courses by topic.</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <CategoryFormFields
                form={form}
                isEditing={false}
                setSlugTouched={setSlugTouched}
                slugTouched={slugTouched}
              />

              <DialogFooter variant="bare">
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button loading={createMutation.isPending} type="submit">
                  Create category
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}

function EditCategoryDialog({ category }: { category: CategoryRow }) {
  const [open, setOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const defaultValues = getCategoryFormValues(category);

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  });

  const updateMutation = useMutation({
    ...trpc.course.updateCategory.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Category updated", type: "success" });
        form.reset(defaultValues);
        setSlugTouched(false);
        setOpen(false);
        await queryClient.invalidateQueries({ queryKey: trpc.course.listCategories.queryKey() });
      },
      onError: (error) =>
        toastManager.add({
          title: "Couldn't update category",
          description: error.message,
          type: "error",
        }),
    }),
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset(defaultValues);
      setSlugTouched(false);
    }
  };

  const onSubmit = async (data: CategoryFormInput) => {
    const orderNum = data.order.trim() === "" ? 0 : Number.parseInt(data.order, 10);
    if (Number.isNaN(orderNum) || orderNum < 0) {
      form.setError("order", { message: "Enter a non-negative whole number" });
      return;
    }

    await updateMutation.mutateAsync({
      categoryId: category.id,
      patch: { name: data.name, slug: data.slug, order: orderNum },
    });
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <EditIcon className="size-4" />
            Edit
          </Button>
        }
      />
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
          <DialogDescription>Categories help students browse courses by topic.</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <CategoryFormFields
                form={form}
                isEditing={true}
                setSlugTouched={setSlugTouched}
                slugTouched={slugTouched}
              />

              <DialogFooter variant="bare">
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button loading={updateMutation.isPending} type="submit">
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}

function DeleteCategoryDialog({ category }: { category: CategoryRow }) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...trpc.course.deleteCategory.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Category deleted", type: "success" });
        setOpen(false);
        await queryClient.invalidateQueries({ queryKey: trpc.course.listCategories.queryKey() });
      },
      onError: (error) =>
        toastManager.add({
          title: "Couldn't delete category",
          description: error.message,
          type: "error",
        }),
    }),
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Trash2Icon className="size-4" />
            Delete
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete category</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{category.name}</strong> is currently used by {category.courseCount} course
            {category.courseCount === 1 ? "" : "s"}. Deleting it will remove this category from the
            taxonomy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
          <Button
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ categoryId: category.id })}
            variant="destructive"
          >
            Delete category
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CategoryListItem({ category }: { category: CategoryRow }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium">{category.name}</h3>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {category.courseCount} course{category.courseCount === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">/{category.slug}</p>
          <p className="text-xs text-muted-foreground">Display order: {category.order}</p>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <EditCategoryDialog category={category} />
          <DeleteCategoryDialog category={category} />
        </div>
      </div>
    </div>
  );
}
