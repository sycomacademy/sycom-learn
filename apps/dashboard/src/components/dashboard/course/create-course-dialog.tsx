import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ReactElement } from "react";

import { useTRPC } from "@/lib/trpc/client";
import { COURSE_STATUSES, DIFFICULTY_LEVELS } from "@sycom/db/schema/course";
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

import {
  COURSE_DIFFICULTY_LABELS,
  COURSE_STATUS_LABELS,
  createCourseSchema,
  DEFAULT_CREATE_COURSE_VALUES,
  type CreateCourseFormInput,
} from "./courses-schema";

type CreateCourseDialogProps = {
  trigger?: ReactElement;
};

export function CreateCourseDialog({ trigger }: CreateCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const listKey = trpc.course.list.queryKey();
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CreateCourseFormInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: DEFAULT_CREATE_COURSE_VALUES,
  });

  const createMutation = useMutation({
    ...trpc.course.create.mutationOptions({
      onSuccess: async ({ courseId }, input) => {
        toastManager.add({
          title: "Course created",
          description: `${input.title} is now a public course.`,
          type: "success",
        });
        setOpen(false);
        form.reset(DEFAULT_CREATE_COURSE_VALUES);
        setSlugTouched(false);
        await queryClient.invalidateQueries({ queryKey: listKey });
        await navigate({ to: "/dashboard/course/$courseId", params: { courseId } });
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
    setOpen(next);
    if (!next) {
      form.reset(DEFAULT_CREATE_COURSE_VALUES);
      setSlugTouched(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {trigger ? <DialogTrigger render={trigger}></DialogTrigger> : null}
      <DialogPopup className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create course</DialogTitle>
          <DialogDescription>
            Start a public course. You can add instructors, categories, and content from the course
            detail page.
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
                                  {COURSE_DIFFICULTY_LABELS[level]}
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
                                  {COURSE_STATUS_LABELS[status]}
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
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Cancel
                </DialogClose>
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
