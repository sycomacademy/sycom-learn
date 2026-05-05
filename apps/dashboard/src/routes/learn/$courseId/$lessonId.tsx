import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import type { Editor, JSONContent } from "@tiptap/core";
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { z } from "zod";

import { Button } from "@sycom/ui/components/button";
import {
  collectLessonQuestionAnswersForSubmit,
  QuestionTrackingProvider,
  RichTextEditor,
  useQuestionGate,
} from "@sycom/ui/components/tiptap/rich-text-editor";
import { toastManager } from "@sycom/ui/components/toast";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@sycom/ui/components/tooltip";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";
import {
  findLessonMetaInSections,
  flattenLearnLessons,
  formatLearnLessonLockMessage,
  lastAccessibleLessonId,
} from "@/lib/learn-player";

const learnLessonSearchSchema = z.object({
  lockedLesson: z.string().optional(),
});

type LearnLessonSearch = z.infer<typeof learnLessonSearchSchema>;

export const Route = createFileRoute("/learn/$courseId/$lessonId")({
  validateSearch: (search) => learnLessonSearchSchema.parse(search),
  loader: async ({ context, params }) => {
    const player = await context.queryClient.ensureQueryData(
      context.trpc.learn.getPlayerContext.queryOptions({ courseId: params.courseId }),
    );
    if (player.status === "ok") {
      const flat = flattenLearnLessons(player.sections);
      const idx = flat.findIndex((l) => l.id === params.lessonId);
      if (idx === -1) {
        throw redirect({
          to: "/learn/$courseId",
          params: { courseId: params.courseId },
        });
      }
      if (flat[idx].locked) {
        const fallback = lastAccessibleLessonId(flat, idx);
        if (fallback) {
          throw redirect({
            to: "/learn/$courseId/$lessonId",
            params: { courseId: params.courseId, lessonId: fallback },
            search: { lockedLesson: params.lessonId },
          });
        }
        throw redirect({
          to: "/learn/$courseId",
          params: { courseId: params.courseId },
          search: { lockedLesson: params.lessonId },
        });
      }
    }
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
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const { data: player } = useSuspenseQuery(trpc.learn.getPlayerContext.queryOptions({ courseId }));
  const { data: lesson } = useSuspenseQuery(
    trpc.learn.getLesson.queryOptions({ courseId, lessonId }),
  );

  useEffect(() => {
    const blockedId = search.lockedLesson;
    if (!blockedId || player.status !== "ok") return;
    const meta = findLessonMetaInSections(player.sections, blockedId);
    toastManager.add({
      title: "Lesson locked",
      description: meta?.lock
        ? `Lesson ${blockedId}: ${formatLearnLessonLockMessage(meta.lock)}`
        : `You can't open lesson ${blockedId} yet.`,
      type: "warning",
    });
    void navigate({
      search: (prev: LearnLessonSearch) => ({ ...prev, lockedLesson: undefined }),
      replace: true,
    });
  }, [search.lockedLesson, player, navigate]);

  const ordered = useMemo(() => {
    if (player.status !== "ok") return [];
    const flat: Array<{ lessonId: string; locked: boolean }> = [];
    for (const sec of player.sections) {
      for (const l of sec.lessons) {
        flat.push({ lessonId: l.id, locked: l.locked });
      }
    }
    return flat;
  }, [player]);

  const idx = ordered.findIndex((l) => l.lessonId === lessonId);
  const prevLessonId = useMemo(() => {
    if (idx < 0) return undefined;
    for (let i = idx - 1; i >= 0; i--) {
      if (!ordered[i].locked) return ordered[i].lessonId;
    }
    return undefined;
  }, [idx, ordered]);
  const nextLessonId = useMemo(() => {
    if (idx < 0) return undefined;
    for (let i = idx + 1; i < ordered.length; i++) {
      if (!ordered[i].locked) return ordered[i].lessonId;
    }
    return undefined;
  }, [idx, ordered]);

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

  const submitAssessment = useMutation(trpc.enrollment.submitAttempt.mutationOptions());

  const [learnEditor, setLearnEditor] = useState<Editor | null>(null);
  useEffect(() => {
    setLearnEditor(null);
  }, [lessonId]);

  const gate = useQuestionGate(learnEditor);

  const currentLessonProgress = useMemo(() => {
    if (player.status !== "ok") return undefined;
    for (const sec of player.sections) {
      const row = sec.lessons.find((les) => les.id === lessonId);
      if (row) return row.progressStatus;
    }
    return undefined;
  }, [player, lessonId]);

  const assessmentCompleted = currentLessonProgress === "completed";

  const onSubmitAssessment = async () => {
    if (!learnEditor || !gate.allCorrect || gate.questionCount === 0 || assessmentCompleted) return;
    try {
      await submitAssessment.mutateAsync({
        courseId,
        lessonId,
        answers: collectLessonQuestionAnswersForSubmit(learnEditor.state),
      });
      await invalidateLearn();
      toastManager.add({ title: "Lesson completed", type: "success" });
    } catch {
      toastManager.add({
        title: "Couldn't submit assessment",
        description: "Check your connection and try again.",
        type: "error",
      });
    }
  };

  const [editorKey, setEditorKey] = useState(0);
  useEffect(() => {
    setEditorKey((k) => k + 1);
  }, [lessonId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 48;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setScrolledToBottom(atBottom);
  }, []);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    setScrolledToBottom(false);
  }, [lessonId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    const onScroll = () => checkScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => checkScroll());
    ro.observe(el);
    const mo = new MutationObserver(() => checkScroll());
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      mo.disconnect();
    };
  }, [lessonId, checkScroll, editorKey]);

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

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5" ref={scrollRef}>
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
            onEditorReady={setLearnEditor}
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
          !scrolledToBottom && !markComplete.isPending ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  (
                    <span className="inline-flex cursor-not-allowed">
                      <Button disabled size="sm" variant="default">
                        Mark complete
                      </Button>
                    </span>
                  ) as ReactElement<Record<string, unknown>>
                }
              />
              <TooltipPopup side="top">
                Scroll to the bottom of this lesson before marking it complete.
              </TooltipPopup>
            </Tooltip>
          ) : (
            <Button
              disabled={!scrolledToBottom || markComplete.isPending}
              loading={markComplete.isPending}
              onClick={() => void onMarkComplete()}
              size="sm"
              variant="default"
            >
              Mark complete
            </Button>
          )
        ) : lesson.type === "quiz" || lesson.type === "exam" ? (
          assessmentCompleted ? (
            <Button disabled size="sm" variant="default">
              Completed
            </Button>
          ) : !learnEditor ? (
            <Button
              className="max-w-[min(100%,22rem)] text-center"
              disabled
              size="sm"
              variant="default"
            >
              Answer all questions before marking complete
            </Button>
          ) : gate.questionCount === 0 ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  (
                    <span className="inline-flex max-w-[min(100%,22rem)] cursor-not-allowed">
                      <Button className="text-center" disabled size="sm" variant="outline">
                        No questions in this lesson
                      </Button>
                    </span>
                  ) as ReactElement<Record<string, unknown>>
                }
              />
              <TooltipPopup side="top">
                Add question blocks to this lesson to enable completion.
              </TooltipPopup>
            </Tooltip>
          ) : !gate.allCorrect ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  (
                    <span className="inline-flex max-w-[min(100%,22rem)] cursor-not-allowed">
                      <Button className="text-center" disabled size="sm" variant="default">
                        Marke complete
                      </Button>
                    </span>
                  ) as ReactElement<Record<string, unknown>>
                }
              />
              <TooltipPopup side="top">
                Mark this lesson complete when you have answered all questions correctly.
              </TooltipPopup>
            </Tooltip>
          ) : (
            <Button
              disabled={submitAssessment.isPending}
              loading={submitAssessment.isPending}
              onClick={() => void onSubmitAssessment()}
              size="sm"
              variant="default"
            >
              Mark complete
            </Button>
          )
        ) : (
          <p className="text-xs text-muted-foreground">
            Complete assessments from the lesson when available.
          </p>
        )}
      </footer>
    </div>
  );
}
