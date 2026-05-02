import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadFile } from "@sycom/storage/client";
import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";

import { useTRPC, useTRPCClient } from "@/lib/trpc/client";
import { DIFFICULTY_LEVELS } from "@sycom/db/schema/course";
import { Button } from "@sycom/ui/components/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from "@sycom/ui/components/combobox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { FileUploader } from "@sycom/ui/components/file-uploader";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@sycom/ui/components/sheet";
import { Spinner } from "@sycom/ui/components/spinner";
import { Textarea } from "@sycom/ui/components/textarea";
import { toastManager } from "@sycom/ui/components/toast";
import { slugify } from "@sycom/ui/lib/string";

import {
  COURSE_DIFFICULTY_LABELS,
  createCourseSchema,
  DEFAULT_CREATE_COURSE_VALUES,
  type CreateCourseFormInput,
} from "./courses-schema";

const CREATE_COURSE_THUMBNAIL_INPUT_ID = "create-course-sheet-thumbnail-input";

const DIFFICULTY_SELECT_ITEMS = DIFFICULTY_LEVELS.map((level) => ({
  value: level,
  label: COURSE_DIFFICULTY_LABELS[level],
}));

type CreateCourseSheetProps = {
  trigger?: ReactElement;
};

export function CreateCourseSheet({ trigger }: CreateCourseSheetProps) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const listKey = trpc.course.list.queryKey();
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploadProgresses, setUploadProgresses] = useState<Record<string, number>>({});
  const [uploaderResetKey, setUploaderResetKey] = useState(0);

  const form = useForm<CreateCourseFormInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: DEFAULT_CREATE_COURSE_VALUES,
  });

  const categoriesQuery = useQuery({
    ...trpc.course.listCategories.queryOptions({
      limit: 200,
      offset: 0,
      sortBy: "name",
      sortDirection: "asc",
    }),
    enabled: open,
  });

  const categoryOptions = (categoriesQuery.data?.rows ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const onSubmit = async (data: CreateCourseFormInput) => {
    try {
      const { courseId } = await trpcClient.course.create.mutate({
        title: data.title,
        slug: data.slug,
        description: data.description.trim() === "" ? undefined : data.description,
        difficulty: data.difficulty,
        status: "draft",
        instructorIds: [],
        categoryIds: data.categoryIds ?? [],
      });

      const rawCover = data.coverImage;
      const coverFile = rawCover instanceof File ? rawCover : undefined;

      if (coverFile) {
        try {
          const signedParams = await trpcClient.storage.signUpload.mutate({
            folder: "course_thumbnails",
            entityType: "course",
            entityId: courseId,
          });

          const uploadResult = await uploadFile({
            file: coverFile,
            signedParams,
            onProgress: (progress) => {
              setUploadProgresses((current) => ({
                ...current,
                [coverFile.name]: progress,
              }));
            },
          });

          await Promise.all([
            trpcClient.storage.saveAsset.mutate({
              publicId: uploadResult.publicId,
              secureUrl: uploadResult.secureUrl,
              folder: "course_thumbnails",
              entityType: "course",
              entityId: courseId,
              resourceType: uploadResult.resourceType,
              format: uploadResult.format,
              bytes: uploadResult.bytes,
              width: uploadResult.width,
              height: uploadResult.height,
              name: coverFile.name,
              tags: ["course-thumbnail"],
            }),
            trpcClient.course.update.mutate({
              courseId,
              patch: { imageUrl: uploadResult.publicId },
            }),
          ]);
        } catch {
          toastManager.add({
            title: "Course created",
            description:
              "We couldn't save the thumbnail. Add a cover image from the course detail page.",
            type: "warning",
          });
        }
      }

      toastManager.add({
        title: "Course created",
        description: `${data.title} is now a public course.`,
        type: "success",
      });

      setOpen(false);
      form.reset(DEFAULT_CREATE_COURSE_VALUES);
      setSlugTouched(false);
      setUploadProgresses({});
      setUploaderResetKey((k) => k + 1);
      await queryClient.invalidateQueries({ queryKey: listKey });
      await navigate({ to: "/dashboard/course/$courseId", params: { courseId } });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't reach server. Check your connection and try again.";

      toastManager.add({
        title: "Couldn't create course",
        description: message,
        type: "error",
      });
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset(DEFAULT_CREATE_COURSE_VALUES);
      setSlugTouched(false);
      setUploadProgresses({});
      setUploaderResetKey((k) => k + 1);
    }
  };

  return (
    <Sheet onOpenChange={handleOpenChange} open={open}>
      {trigger ? <SheetTrigger render={trigger} /> : null}
      <SheetPopup className="max-w-2xl" side="right" variant="inset">
        <SheetHeader>
          <div className="space-y-1 pe-8">
            <SheetTitle>Create course</SheetTitle>
            <SheetDescription>
              Start a public course. Add instructors and lessons from the course detail page.
            </SheetDescription>
          </div>
        </SheetHeader>

        <SheetPanel>
          <Form {...form}>
            <form
              className="flex max-w-2xl flex-col gap-6"
              id="create-course-sheet-form"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="coverImage"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs" htmlFor={CREATE_COURSE_THUMBNAIL_INPUT_ID}>
                        Thumbnail
                      </FieldLabel>
                      <FormControl>
                        <FileUploader
                          accept="image/*"
                          className="w-full"
                          disabled={form.formState.isSubmitting}
                          inputId={CREATE_COURSE_THUMBNAIL_INPUT_ID}
                          key={uploaderResetKey}
                          maxFileCount={1}
                          maxSize={1024 * 1024 * 10}
                          onFilesChange={(files) => {
                            const first = files[0];
                            const next =
                              first && "file" in first && first.file instanceof File
                                ? first.file
                                : undefined;
                            field.onChange(next);
                          }}
                          progresses={uploadProgresses}
                        />
                      </FormControl>
                      <FieldDescription>Optional cover image, up to 10 MiB</FieldDescription>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs">Title</FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="e.g. Introduction to Network Security"
                          {...field}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            field.onChange(value);
                            if (!slugTouched) {
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
                      <FieldLabel className="text-xs">Slug</FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="e.g. intro-to-network-security"
                          {...field}
                          onChange={(event) => {
                            setSlugTouched(true);
                            field.onChange(event.currentTarget.value);
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        URL-friendly identifier. Auto-generated from the title until you edit it.
                      </p>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs">Description</FieldLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what students will learn..."
                          rows={4}
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
                name="categoryIds"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field className="w-full" invalid={!!fieldState.error}>
                      <FieldLabel className="text-xs">Categories</FieldLabel>
                      {categoriesQuery.isLoading ? (
                        <div className="flex min-h-10 items-center gap-2">
                          <Spinner className="size-4" />
                          <span className="text-sm text-muted-foreground">Loading categories…</span>
                        </div>
                      ) : categoryOptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No categories yet. Create some on the Categories tab.
                        </p>
                      ) : (
                        <FormControl>
                          <Combobox
                            itemToStringLabel={(item) => item.label}
                            items={categoryOptions}
                            multiple
                            onValueChange={(next) => field.onChange(next.map((item) => item.value))}
                            value={categoryOptions.filter((item) =>
                              (field.value ?? []).includes(item.value),
                            )}
                          >
                            <ComboboxChips aria-invalid={!!fieldState.error} className="w-full">
                              <ComboboxValue>
                                {(selected: typeof categoryOptions) => (
                                  <>
                                    {selected.map((item) => (
                                      <ComboboxChip aria-label={item.label} key={item.value}>
                                        {item.label}
                                      </ComboboxChip>
                                    ))}
                                    <ComboboxChipsInput
                                      aria-label="Select categories"
                                      disabled={form.formState.isSubmitting}
                                      placeholder={
                                        selected.length > 0 ? undefined : "Select categories..."
                                      }
                                    />
                                  </>
                                )}
                              </ComboboxValue>
                            </ComboboxChips>
                            <ComboboxPopup>
                              <ComboboxEmpty>No categories found.</ComboboxEmpty>
                              <ComboboxList>
                                {(item: (typeof categoryOptions)[number]) => (
                                  <ComboboxItem key={item.value} value={item}>
                                    {item.label}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxPopup>
                          </Combobox>
                        </FormControl>
                      )}
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs">Difficulty</FieldLabel>
                      <FormControl>
                        <Select
                          items={DIFFICULTY_SELECT_ITEMS}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(value);
                            }
                          }}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {DIFFICULTY_SELECT_ITEMS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </SheetPanel>

        <SheetFooter variant="bare">
          <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
          <Button
            form="create-course-sheet-form"
            loading={form.formState.isSubmitting}
            type="submit"
          >
            Create course
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
