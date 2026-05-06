import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DIFFICULTY_LEVELS } from "@sycom/db/schema/course";
import type { JSONContent } from "@tiptap/core";
import { uploadFile } from "@sycom/storage/client";
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
import { ImageZoom } from "@sycom/ui/components/kibo-ui/image-zoom";
import { Switch } from "@sycom/ui/components/switch";
import { Textarea } from "@sycom/ui/components/textarea";
import { RichTextEditor } from "@sycom/ui/components/tiptap/rich-text-editor";
import { toastManager } from "@sycom/ui/components/toast";
import { Image } from "@sycom/ui/image";
import { slugify } from "@sycom/ui/lib/string";
import { useForm } from "react-hook-form";
import type { AppRouterInputs, AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

import { useTRPC, useTRPCClient } from "@/lib/trpc/client";
import { COURSE_DIFFICULTY_LABELS } from "@/components/dashboard/course/courses-schema";

const UPDATE_COURSE_THUMBNAIL_INPUT_ID = "update-course-thumbnail-input";

const DIFFICULTY_SELECT_ITEMS = DIFFICULTY_LEVELS.map((level) => ({
  value: level,
  label: COURSE_DIFFICULTY_LABELS[level],
}));

const editCourseSchema = z.object({
  title: z.string().check(z.minLength(1, "Title is required"), z.maxLength(160)),
  slug: z.string().check(
    z.minLength(2, "Slug must be at least 2 characters"),
    z.maxLength(80, "Slug must be at most 80 characters"),
    z.regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "Use lowercase letters, numbers, and hyphens only",
    ),
    z.refine((value) => !value.includes("--"), "No consecutive hyphens"),
  ),
  description: z.string().check(z.maxLength(2000)),
  summary: z.any().check(
    z.refine((value) => {
      if (value === null) return true;
      if (typeof value !== "object" || value === null) return false;
      try {
        return JSON.stringify(value).length <= 20_000;
      } catch {
        return false;
      }
    }, "Summary must be at most 20,000 characters when serialized"),
  ),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  status: z.enum(["draft", "published"]),
  categoryIds: z.array(z.string().min(1)),
  coverImage: z.any().optional(),
});

type EditCourseFormInput = z.infer<typeof editCourseSchema>;
type CategoryOption = AppRouterOutputs["course"]["listCategories"]["rows"][number];
type CourseDetail = AppRouterOutputs["orgCourse"]["get"];
type UpdateCoursePatchInput = AppRouterInputs["orgCourse"]["update"]["patch"];

function getPlainTextFromJsonContent(node: JSONContent | null | undefined): string {
  if (!node) return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (!node.content) return "";
  return node.content.map((child) => getPlainTextFromJsonContent(child)).join("");
}

function isSummaryDocEmpty(doc: JSONContent | null): boolean {
  return getPlainTextFromJsonContent(doc).trim() === "";
}

function courseSummaryToEditorContent(summary: unknown): JSONContent | null {
  if (summary == null) return null;

  if (typeof summary === "object" && summary !== null && "type" in summary) {
    return summary as JSONContent;
  }

  if (typeof summary === "string") {
    const trimmed = summary.trim();
    if (trimmed === "") return null;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null && "type" in parsed) {
        return parsed as JSONContent;
      }
    } catch {
      // Legacy plain-text summaries stored as a JSON string or plain text.
    }
    return {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: summary }] }],
    };
  }

  return null;
}

function normalizeSummaryForStorage(doc: JSONContent | null): JSONContent | null {
  if (doc == null || isSummaryDocEmpty(doc)) return null;
  return doc;
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;

  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();

  return leftSorted.every((value, index) => value === rightSorted[index]);
}

function getDefaultValues(course: CourseDetail): EditCourseFormInput {
  return {
    title: course.title,
    slug: course.slug,
    description: course.description ?? "",
    summary: courseSummaryToEditorContent(course.summary),
    difficulty: course.difficulty,
    status: course.status,
    categoryIds: course.categories.map((category) => category.id),
    coverImage: undefined,
  };
}

export const Route = createFileRoute("/dashboard/org/courses/$courseId/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.course.listCategories.queryOptions({
        limit: 200,
        offset: 0,
        sortBy: "name",
        sortDirection: "asc",
      }),
    );
  },
  component: CourseDetailsPage,
});

function CourseDetailsPage() {
  const { courseId } = Route.useParams();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const { data: course } = useSuspenseQuery(trpc.orgCourse.get.queryOptions({ courseId }));
  const { data: categoriesResult } = useSuspenseQuery(
    trpc.course.listCategories.queryOptions({
      limit: 200,
      offset: 0,
      sortBy: "name",
      sortDirection: "asc",
    }),
  );

  const categoryOptions = categoriesResult.rows;
  const form = useForm<EditCourseFormInput>({
    resolver: zodResolver(editCourseSchema),
    defaultValues: getDefaultValues(course),
  });
  const selectedCoverImage = form.watch("coverImage") as File | undefined;

  const onSubmit = async (data: EditCourseFormInput) => {
    const trimmedDescription = data.description.trim();
    const nextSummary = normalizeSummaryForStorage(data.summary);
    const currentSummary = normalizeSummaryForStorage(courseSummaryToEditorContent(course.summary));
    const patch: UpdateCoursePatchInput = {};

    if (data.title.trim() !== course.title) patch.title = data.title.trim();
    if (data.slug.trim() !== course.slug) patch.slug = data.slug.trim();
    if (trimmedDescription !== (course.description ?? "")) {
      patch.description = trimmedDescription === "" ? null : trimmedDescription;
    }
    if (JSON.stringify(nextSummary) !== JSON.stringify(currentSummary)) {
      patch.summary = nextSummary;
    }
    if (data.difficulty !== course.difficulty) patch.difficulty = data.difficulty;
    if (data.status !== course.status) patch.status = data.status;

    const currentCategoryIds = course.categories.map((category) => category.id);
    const categoriesChanged = !areStringArraysEqual(data.categoryIds, currentCategoryIds);
    const coverImage = selectedCoverImage instanceof File ? selectedCoverImage : undefined;

    try {
      if (coverImage) {
        const signedParams = await trpcClient.storage.signUpload.mutate({
          folder: "course_thumbnails",
          entityType: "course",
          entityId: courseId,
        });

        const uploadResult = await uploadFile({ file: coverImage, signedParams });
        patch.imageUrl = uploadResult.publicId;

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
            name: coverImage.name,
            tags: ["course-thumbnail"],
          }),
          ...(Object.keys(patch).length > 0
            ? [trpcClient.orgCourse.update.mutate({ courseId, patch })]
            : []),
          ...(categoriesChanged
            ? [
                trpcClient.orgCourse.setCategories.mutate({
                  courseId,
                  categoryIds: data.categoryIds,
                }),
              ]
            : []),
        ]);
      } else {
        const operations = [
          ...(Object.keys(patch).length > 0
            ? [trpcClient.orgCourse.update.mutate({ courseId, patch })]
            : []),
          ...(categoriesChanged
            ? [
                trpcClient.orgCourse.setCategories.mutate({
                  courseId,
                  categoryIds: data.categoryIds,
                }),
              ]
            : []),
        ];

        if (operations.length === 0) {
          return;
        }

        await Promise.all(operations);
      }

      const nextDefaults: EditCourseFormInput = {
        ...data,
        title: data.title.trim(),
        slug: data.slug.trim(),
        description: trimmedDescription,
        summary: nextSummary,
        coverImage: undefined,
      };

      form.reset(nextDefaults);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.orgCourse.get.queryKey({ courseId }) }),
        queryClient.invalidateQueries({ queryKey: trpc.orgCourse.list.queryKey() }),
      ]);

      toastManager.add({
        title: "Course updated",
        description: "Your changes have been saved.",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't reach server. Check your connection and try again.";

      toastManager.add({
        title: "Couldn't update course",
        description: message,
        type: "error",
      });
    }
  };

  return (
    <div className="max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="coverImage"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel className="text-xs" htmlFor={UPDATE_COURSE_THUMBNAIL_INPUT_ID}>
                    Thumbnail
                  </FieldLabel>
                  {course.imageUrl && !selectedCoverImage ? (
                    <ImageZoom>
                      <Image
                        alt={course.title}
                        className="mb-3 aspect-video w-full max-w-sm rounded-md object-cover"
                        height={180}
                        src={course.imageUrl}
                        width={320}
                      />
                    </ImageZoom>
                  ) : null}
                  <FormControl>
                    <FileUploader
                      accept="image/*"
                      className="w-full"
                      disabled={form.formState.isSubmitting}
                      inputId={UPDATE_COURSE_THUMBNAIL_INPUT_ID}
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
                    />
                  </FormControl>
                  <FieldDescription>
                    Upload a new cover image to replace the current thumbnail.
                  </FieldDescription>
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

                        if (!form.getFieldState("slug").isDirty) {
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
                    />
                  </FormControl>
                  <FieldDescription>
                    URL-friendly identifier. Auto-generated from the title until you edit it.
                  </FieldDescription>
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
                  <FieldDescription>
                    Short description shown in course cards and listings.
                  </FieldDescription>
                  <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                </Field>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="summary"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel className="text-xs">Summary</FieldLabel>
                  <FormControl>
                    <RichTextEditor
                      key={courseId}
                      content={field.value}
                      contentClassName="font-sans"
                      editorContentClassName="min-h-[120px]"
                      editable={!form.formState.isSubmitting}
                      mode="lightweight"
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FieldDescription>Detailed overview</FieldDescription>
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
                  <FormControl>
                    <Combobox
                      itemToStringLabel={(item) => item.name}
                      items={categoryOptions}
                      multiple
                      onValueChange={(next) => field.onChange(next.map((item) => item.id))}
                      value={categoryOptions.filter((item) =>
                        (field.value ?? []).includes(item.id),
                      )}
                    >
                      <ComboboxChips aria-invalid={!!fieldState.error} className="w-full">
                        <ComboboxValue>
                          {(selected: CategoryOption[]) => (
                            <>
                              {selected.map((item) => (
                                <ComboboxChip aria-label={item.name} key={item.id}>
                                  {item.name}
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
                          {(item: CategoryOption) => (
                            <ComboboxItem key={item.id} value={item}>
                              {item.name}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxPopup>
                    </Combobox>
                  </FormControl>
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
                        if (value) field.onChange(value);
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

          <FormField
            control={form.control}
            name="status"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="space-y-1">
                      <FieldLabel className="text-xs">Publish course</FieldLabel>
                      <FieldDescription>
                        {field.value === "published"
                          ? "This course is visible to students."
                          : "This course stays hidden until you publish it."}
                      </FieldDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === "published"}
                        disabled={form.formState.isSubmitting}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? "published" : "draft")
                        }
                      />
                    </FormControl>
                  </div>
                  <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                </Field>
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-6">
            <Button
              disabled={!form.formState.isDirty}
              loading={form.formState.isSubmitting}
              type="submit"
            >
              Save changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
