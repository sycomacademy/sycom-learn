import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { JSONContent } from "@tiptap/core";
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@sycom/ui/components/button";
import {
  QuestionTrackingProvider,
  RichTextEditor,
} from "@sycom/ui/components/tiptap/rich-text-editor";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";

export const Route = createFileRoute("/learn/$courseId/$lessonId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.learn.getLesson.queryOptions({
        courseId: params.courseId,
        lessonId: params.lessonId,
      }),
    );
  },
  component: LearnLessonPage,
});

function LearnLessonPage() {
  const { courseId, lessonId } = Route.useParams();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const { data: player } = useSuspenseQuery(trpc.learn.getPlayerContext.queryOptions({ courseId }));
  const { data: lesson } = useSuspenseQuery(
    trpc.learn.getLesson.queryOptions({ courseId, lessonId }),
  );

  const ordered = useMemo(() => {
    if (player.status !== "ok") return [];
    const flat: Array<{ lessonId: string }> = [];
    for (const sec of player.sections) {
      for (const l of sec.lessons) {
        flat.push({ lessonId: l.id });
      }
    }
    return flat;
  }, [player]);

  const idx = ordered.findIndex((l) => l.lessonId === lessonId);
  const prevLessonId = idx > 0 ? ordered[idx - 1]?.lessonId : undefined;
  const nextLessonId =
    idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1]?.lessonId : undefined;

  const { mutate: fireMarkStarted } = useMutation(
    trpc.enrollment.markLessonStarted.mutationOptions(),
  );
  const markComplete = useMutation(trpc.enrollment.markLessonCompleted.mutationOptions());

  useEffect(() => {
    fireMarkStarted({ courseId, lessonId });
  }, [courseId, lessonId, fireMarkStarted]);

  const invalidateLearn = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.learn.getPlayerContext.queryKey({ courseId }),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.learn.getLesson.queryKey({ courseId, lessonId }),
    });
  };

  const onMarkComplete = async () => {
    try {
      await markComplete.mutateAsync({ courseId, lessonId });
      await invalidateLearn();
    } catch {
      /* server shows error via tRPC if needed */
    }
  };

  const showMarkComplete = lesson.type === "article";

  const [editorKey, setEditorKey] = useState(0);
  useEffect(() => {
    setEditorKey((k) => k + 1);
  }, [lessonId]);

  if (player.status !== "ok") {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b bg-background px-4 py-3">
        <Button render={<Link to="/dashboard" />} size="sm" variant="outline">
          <HomeIcon />
          Home
        </Button>
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-medium">{player.courseTitle}</p>
          <p className="truncate text-xs text-muted-foreground">
            {lesson.sectionTitle} · {lesson.title}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl">{lesson.title}</h1>
        <QuestionTrackingProvider>
          <RichTextEditor
            key={editorKey}
            className="border-0 bg-transparent"
            content={(lesson.content ?? null) as JSONContent | null}
            editable={false}
            mode="full"
            onCheckAnswer={async (args: { questionId: string; selected: string[] }) => {
              const result = await trpcClient.learn.checkAnswer.mutate({
                courseId,
                lessonId,
                questionId: args.questionId,
                selected: args.selected,
              });
              return { isCorrect: result.isCorrect };
            }}
            showAdvancedChrome={false}
            variant="learn"
          />
        </QuestionTrackingProvider>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-background px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {prevLessonId ? (
            <Button
              render={
                <Link
                  params={{ courseId, lessonId: prevLessonId }}
                  to="/learn/$courseId/$lessonId"
                />
              }
              size="sm"
              variant="outline"
            >
              <ChevronLeftIcon />
              Previous
            </Button>
          ) : (
            <Button disabled size="sm" variant="outline">
              <ChevronLeftIcon />
              Previous
            </Button>
          )}
          {nextLessonId ? (
            <Button
              render={
                <Link
                  params={{ courseId, lessonId: nextLessonId }}
                  to="/learn/$courseId/$lessonId"
                />
              }
              size="sm"
              variant="outline"
            >
              Next
              <ChevronRightIcon />
            </Button>
          ) : (
            <Button disabled size="sm" variant="outline">
              Next
              <ChevronRightIcon />
            </Button>
          )}
        </div>
        {showMarkComplete ? (
          <Button
            disabled={markComplete.isPending}
            loading={markComplete.isPending}
            onClick={() => void onMarkComplete()}
            size="sm"
            variant="default"
          >
            Mark complete
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Complete assessments from the lesson when available.
          </p>
        )}
      </footer>
    </div>
  );
}
