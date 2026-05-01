import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { useTRPC } from "@/lib/trpc/client";
import {
  COURSE_STATUSES,
  DIFFICULTY_LEVELS,
  type CourseStatus,
  type DifficultyLevel,
} from "@sycom/db/schema/catalog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import { Textarea } from "@sycom/ui/components/textarea";
import { toastManager } from "@sycom/ui/components/toast";
import { slugify } from "@sycom/ui/lib/string";

const createCourseSchema = z.object({
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
  difficulty: z.enum(DIFFICULTY_LEVELS),
  status: z.enum(COURSE_STATUSES),
});

type CreateCourseFormInput = z.infer<typeof createCourseSchema>;

const DEFAULT_VALUES: CreateCourseFormInput = {
  title: "",
  slug: "",
  description: "",
  difficulty: "beginner",
  status: "draft",
};

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

type CreateCourseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateCourseDialog({ open, onOpenChange }: CreateCourseDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const listKey = trpc.catalog.list.queryKey();
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CreateCourseFormInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const createMutation = useMutation({
    ...trpc.catalog.create.mutationOptions({
      onSuccess: async ({ courseId }, input) => {
        toastManager.add({
          title: "Course created",
          description: `${input.title} is in the public catalog.`,
          type: "success",
        });
        onOpenChange(false);
        form.reset(DEFAULT_VALUES);
        setSlugTouched(false);
        await queryClient.invalidateQueries({ queryKey: listKey });
        await navigate({ to: "/dashboard/admin/catalog/$courseId", params: { courseId } });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't create course",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const onSubmit = async (data: CreateCourseFormInput) => {
    await createMutation.mutateAsync({
      title: data.title,
      slug: data.slug,
      description: data.description || undefined,
      difficulty: data.difficulty,
      status: data.status,
      instructorIds: [],
      categoryIds: [],
    });
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
          <DialogTitle>Create course</DialogTitle>
          <DialogDescription>
            Start a public catalog course. You can add instructors, categories, and content from the
            course detail page.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
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
                        <Input
                          autoComplete="off"
                          placeholder="Introduction to Statistics"
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
                      <FieldLabel>Slug</FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="introduction-to-statistics"
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
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Description</FieldLabel>
                      <FormControl>
                        <Textarea
                          placeholder="One or two sentences describing what students will learn."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                              <SelectValue placeholder="Pick difficulty" />
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
                              <SelectValue placeholder="Pick status" />
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
              </div>

              <DialogFooter variant="bare">
                <Button onClick={() => handleOpenChange(false)} type="button" variant="outline">
                  Cancel
                </Button>
                <Button loading={form.formState.isSubmitting} type="submit">
                  Create course
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
