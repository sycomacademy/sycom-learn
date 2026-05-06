import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { DIFFICULTY_LEVELS } from "@sycom/db/schema/course";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
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
import { Textarea } from "@sycom/ui/components/textarea";
import { TRPCClientError } from "@trpc/client";
import { SparklesIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Link } from "@/components/layout/foresight-link";
import { COURSE_DIFFICULTY_LABELS } from "@/components/dashboard/course/courses-schema";
import { sessionQueryOptions } from "@/lib/auth/session";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";

const DIFFICULTY_ITEMS = DIFFICULTY_LEVELS.map((level) => ({
  value: level,
  label: COURSE_DIFFICULTY_LABELS[level],
}));

const generateCourseAiFormSchema = z.object({
  topic: z.string().trim().min(8, "Topic must be at least 8 characters").max(500),
  audience: z.string().trim().max(200).optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  sectionCount: z.number().int().min(1).max(10),
  lessonsPerSection: z.number().int().min(1).max(8),
  includeQuizzes: z.boolean(),
});

type GenerateCourseAiFormInput = z.infer<typeof generateCourseAiFormSchema>;

function canGenerateCourseAi(role: string | null | undefined): boolean {
  return role === "platform_admin" || role === "content_creator";
}

export const Route = createFileRoute("/dashboard/course/generate")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions());
    if (!canGenerateCourseAi(session?.user.role)) {
      throw redirect({ to: "/dashboard/course" });
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.courseAi.getQuotaStatus.queryOptions());
  },
  component: GenerateCourseAiPage,
});

function GenerateCourseAiPage() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const quota = useSuspenseQuery(trpc.courseAi.getQuotaStatus.queryOptions());

  const form = useForm<GenerateCourseAiFormInput>({
    resolver: zodResolver(generateCourseAiFormSchema),
    defaultValues: {
      topic: "",
      audience: "",
      difficulty: "beginner",
      sectionCount: 4,
      lessonsPerSection: 4,
      includeQuizzes: true,
    },
  });

  const atQuota = quota.data.used >= quota.data.limit;

  const onSubmit = async (data: GenerateCourseAiFormInput) => {
    if (atQuota) {
      toastManager.add({
        title: "Weekly limit reached",
        description: "You have used all AI generations for this week.",
        type: "error",
      });
      return;
    }

    try {
      const { courseId } = await trpcClient.courseAi.generateWithAI.mutate({
        topic: data.topic,
        audience: data.audience?.trim() ? data.audience.trim() : undefined,
        difficulty: data.difficulty,
        sectionCount: data.sectionCount,
        lessonsPerSection: data.lessonsPerSection,
        includeQuizzes: data.includeQuizzes,
      });

      toastManager.add({
        title: "Course draft created",
        description: "Review and publish from the course settings when ready.",
        type: "success",
      });

      await queryClient.invalidateQueries({ queryKey: trpc.course.list.queryKey() });
      await queryClient.invalidateQueries({ queryKey: trpc.courseAi.getQuotaStatus.queryKey() });

      await navigate({
        to: "/dashboard/course/$courseId",
        params: { courseId },
      });
    } catch (error) {
      const message =
        error instanceof TRPCClientError
          ? error.message
          : "Couldn't reach the server. Check your connection and try again.";
      toastManager.add({
        title: "Generation failed",
        description: message,
        type: "error",
      });
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Generate course with AI</h1>
          <Badge variant="secondary">
            {quota.data.used}/{quota.data.limit} generations used (7-day rolling window)
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Creates a draft platform course with sections, lessons, and placeholder media notes. Quiz
          questions are embedded where applicable. Thumbnails and uploads are still manual.
        </p>
        {quota.data.nextResetAt ? (
          <p className="text-xs text-muted-foreground">
            Quota full — next slot frees after{" "}
            <time dateTime={quota.data.nextResetAt.toISOString()}>
              {quota.data.nextResetAt.toLocaleString()}
            </time>
            .
          </p>
        ) : null}
      </div>

      <Form {...form}>
        <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="topic"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel htmlFor="ai-course-topic">Topic</FieldLabel>
                  <FormControl>
                    <Textarea
                      autoComplete="off"
                      className="min-h-[100px] resize-y"
                      id="ai-course-topic"
                      placeholder="e.g. Introduction to project management for new team leads"
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
            name="audience"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel htmlFor="ai-course-audience">Audience (optional)</FieldLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      id="ai-course-audience"
                      placeholder="e.g. First-time managers, healthcare staff"
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
            name="difficulty"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel htmlFor="ai-course-difficulty">Difficulty</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full" id="ai-course-difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DIFFICULTY_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                </Field>
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="sectionCount"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field>
                    <FieldLabel htmlFor="ai-course-sections">Sections</FieldLabel>
                    <FormControl>
                      <Input
                        id="ai-course-sections"
                        max={10}
                        min={1}
                        onChange={(e) => {
                          const parsed = Number.parseInt(e.target.value, 10);
                          field.onChange(
                            Number.isNaN(parsed) ? field.value : Math.min(10, Math.max(1, parsed)),
                          );
                        }}
                        type="number"
                        value={field.value}
                      />
                    </FormControl>
                    <FieldDescription>1–10 sections</FieldDescription>
                    <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                  </Field>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lessonsPerSection"
              render={({ field, fieldState }) => (
                <FormItem>
                  <Field>
                    <FieldLabel htmlFor="ai-course-lessons">Lessons per section</FieldLabel>
                    <FormControl>
                      <Input
                        id="ai-course-lessons"
                        max={8}
                        min={1}
                        onChange={(e) => {
                          const parsed = Number.parseInt(e.target.value, 10);
                          field.onChange(
                            Number.isNaN(parsed) ? field.value : Math.min(8, Math.max(1, parsed)),
                          );
                        }}
                        type="number"
                        value={field.value}
                      />
                    </FormControl>
                    <FieldDescription>1–8 lessons each</FieldDescription>
                    <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                  </Field>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="includeQuizzes"
            render={({ field }) => (
              <FormItem>
                <Field orientation="horizontal">
                  <Checkbox
                    checked={field.value}
                    id="ai-course-quizzes"
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="ai-course-quizzes">Include quiz lessons</FieldLabel>
                    <FieldDescription>
                      Adds at least one quiz per section with multiple-choice questions.
                    </FieldDescription>
                  </div>
                </Field>
              </FormItem>
            )}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={atQuota} loading={form.formState.isSubmitting} type="submit">
              <SparklesIcon className="size-4" />
              Generate draft course
            </Button>
            <Button render={<Link to="/dashboard/course" />} variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
