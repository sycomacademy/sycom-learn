import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { useTRPC } from "@/lib/trpc/client";
import {
  COURSE_STATUSES,
  DIFFICULTY_LEVELS,
  type CourseStatus,
  type DifficultyLevel,
} from "@sycom/db/schema/catalog";
import { Button } from "@sycom/ui/components/button";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import { Textarea } from "@sycom/ui/components/textarea";
import { toastManager } from "@sycom/ui/components/toast";

type CourseDetail = AppRouterOutputs["catalog"]["get"];

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
  imageUrl: z.string().check(z.maxLength(500)),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  status: z.enum(COURSE_STATUSES),
  estimatedDuration: z.string().check(z.maxLength(8)),
});

type EditCourseFormInput = z.infer<typeof editCourseSchema>;

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "Draft",
  published: "Published",
};

function toFormDefaults(course: CourseDetail): EditCourseFormInput {
  return {
    title: course.title,
    slug: course.slug,
    description: course.description ?? "",
    imageUrl: course.imageUrl ?? "",
    difficulty: course.difficulty,
    status: course.status,
    estimatedDuration: course.estimatedDuration === null ? "" : String(course.estimatedDuration),
  };
}

export function EditCourseForm({ course }: { course: CourseDetail }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<EditCourseFormInput>({
    resolver: zodResolver(editCourseSchema),
    defaultValues: toFormDefaults(course),
  });

  useEffect(() => {
    form.reset(toFormDefaults(course));
  }, [course, form]);

  const updateMutation = useMutation({
    ...trpc.catalog.update.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "Course saved",
          description: "Metadata changes are live.",
          type: "success",
        });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.catalog.get.queryKey({ courseId: course.id }),
          }),
          queryClient.invalidateQueries({ queryKey: trpc.catalog.list.queryKey() }),
        ]);
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't save course",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const onSubmit = async (data: EditCourseFormInput) => {
    const trimmedDuration = data.estimatedDuration.trim();
    const parsedDuration = trimmedDuration === "" ? null : Number.parseInt(trimmedDuration, 10);
    if (parsedDuration !== null && (Number.isNaN(parsedDuration) || parsedDuration <= 0)) {
      form.setError("estimatedDuration", { message: "Enter a positive whole number of minutes" });
      return;
    }

    await updateMutation.mutateAsync({
      courseId: course.id,
      patch: {
        title: data.title,
        slug: data.slug,
        description: data.description.trim() === "" ? null : data.description,
        imageUrl: data.imageUrl.trim() === "" ? null : data.imageUrl,
        difficulty: data.difficulty,
        status: data.status,
        estimatedDuration: parsedDuration,
      },
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field>
                <FieldLabel>Title</FieldLabel>
                <FormControl>
                  <Input autoComplete="off" {...field} />
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
                  <Input autoComplete="off" {...field} />
                </FormControl>
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
                <FieldLabel>Description</FieldLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
                <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
              </Field>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field>
                <FieldLabel>Cover image (Cloudinary public ID)</FieldLabel>
                <FormControl>
                  <Input autoComplete="off" placeholder="catalog/intro-to-stats" {...field} />
                </FormControl>
                <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
              </Field>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel>Difficulty</FieldLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {DIFFICULTY_LABELS[level]}
                          </SelectItem>
                        ))}
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
                  <FieldLabel>Status</FieldLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
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
            name="estimatedDuration"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel>Duration (minutes)</FieldLabel>
                  <FormControl>
                    <Input autoComplete="off" inputMode="numeric" placeholder="60" {...field} />
                  </FormControl>
                  <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                </Field>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
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
  );
}
