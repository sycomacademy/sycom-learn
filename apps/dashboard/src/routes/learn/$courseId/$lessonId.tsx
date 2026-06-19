import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { Editor, JSONContent } from "@tiptap/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import type { AppRouterOutputs } from "server/trpc/routers/_app";
import {
  collectLessonQuestionAnswersForSubmit,
  QuestionTrackingProvider,
  RichTextEditor,
  useHydrateLessonAnswers,
  useQuestionGate,
} from "@sycom/ui/components/tiptap/rich-text-editor";
import { fireCelebrationConfetti } from "@sycom/ui/components/elements/confetti";
import { toastManager } from "@sycom/ui/components/toast";

import { LearnFooter } from "@/components/learn/learn-footer";
import { useLessonSignedMediaResolver } from "@/hooks/use-lesson-signed-media";
import {
  useExamIntegritySession,
  type ExamIntegrityFlagKind,
} from "@/hooks/use-exam-integrity-session";
import {
  findLessonMetaInSections,
  findUnlockedNeighbor,
  flattenLearnLessons,
  formatLearnLessonLockMessage,
  lastAccessibleLessonId,
  useScrolledToBottom,
} from "@/lib/learn-player";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";

const learnLessonSearchSchema = z.object({
  lockedLesson: z.string().optional(),
});

type PlayerContext = AppRouterOutputs["learn"]["getPlayerContext"];
type OkPlayer = Extract<PlayerContext, { status: "ok" }>;
type Lesson = AppRouterOutputs["learn"]["getLesson"];

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
    void navigate({ search: { lockedLesson: undefined }, replace: true });
  }, [search.lockedLesson, player, navigate]);

  if (player.status !== "ok") return null;

  return <LearnLessonBody key={lessonId} courseId={courseId} lesson={lesson} player={player} />;
}

function LearnLessonBody({
  courseId,
  lesson,
  player,
}: {
  courseId: string;
  lesson: Lesson;
  player: OkPlayer;
}) {
  const lessonId = lesson.id;
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const flat = flattenLearnLessons(player.sections);
  const idx = flat.findIndex((l) => l.id === lessonId);
  const prevLessonId = findUnlockedNeighbor(flat, idx, "prev");
  const nextLessonId = findUnlockedNeighbor(flat, idx, "next");
  const assessmentCompleted =
    findLessonMetaInSections(player.sections, lessonId)?.progressStatus === "completed";
  const resolveMediaUrl = useLessonSignedMediaResolver(
    (lesson.content ?? null) as JSONContent | null,
  );

  const { mutate: fireMarkStarted } = useMutation(
    trpc.enrollment.markLessonStarted.mutationOptions(),
  );
  useEffect(() => {
    fireMarkStarted({ courseId, lessonId });
  }, [courseId, lessonId, fireMarkStarted]);

  const markComplete = useMutation(trpc.enrollment.markLessonCompleted.mutationOptions());
  const submitAssessment = useMutation(trpc.enrollment.submitAttempt.mutationOptions());
  const recordIntegrity = useMutation(trpc.learn.recordExamIntegrityFlag.mutationOptions());

  const examIntegrityEnabled = lesson.type === "exam" && !assessmentCompleted;
  const [examSessionStarted, setExamSessionStarted] = useState(!examIntegrityEnabled);

  useEffect(() => {
    setExamSessionStarted(!examIntegrityEnabled);
  }, [examIntegrityEnabled, lessonId]);

  const reportExamFlag = useCallback(
    (kind: ExamIntegrityFlagKind) => {
      if (!examIntegrityEnabled) return;
      recordIntegrity.mutate({ courseId, lessonId, kind });
    },
    [courseId, lessonId, examIntegrityEnabled, recordIntegrity],
  );

  const examShellRef = useRef<HTMLDivElement>(null);

  useExamIntegritySession({
    enabled: examIntegrityEnabled,
    sessionActive: examSessionStarted,
    containerRef: examShellRef,
    onFlag: reportExamFlag,
  });

  const startExamSession = useCallback(async () => {
    const el = examShellRef.current;
    if (typeof el?.requestFullscreen === "function") {
      try {
        await el.requestFullscreen();
      } catch {
        recordIntegrity.mutate({ courseId, lessonId, kind: "fullscreen_denied" });
      }
    } else {
      recordIntegrity.mutate({ courseId, lessonId, kind: "fullscreen_denied" });
    }
    setExamSessionStarted(true);
  }, [courseId, lessonId, recordIntegrity]);

  const refreshLearnData = async (): Promise<PlayerContext | undefined> => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: trpc.learn.getPlayerContext.queryKey({ courseId }) }),
      queryClient.refetchQueries({
        queryKey: trpc.learn.getLesson.queryKey({ courseId, lessonId }),
      }),
    ]);
    return queryClient.getQueryData(trpc.learn.getPlayerContext.queryKey({ courseId }));
  };

  const maybeCelebrateCourseComplete = (nextPlayer: PlayerContext | undefined) => {
    if (
      nextPlayer?.status === "ok" &&
      nextPlayer.totalLessonCount > 0 &&
      nextPlayer.completedLessonCount === nextPlayer.totalLessonCount
    ) {
      fireCelebrationConfetti();
    }
  };

  const [editor, setEditor] = useState<Editor | null>(null);
  const gate = useQuestionGate(editor);
  useHydrateLessonAnswers(editor, lesson.answers);

  const onMarkComplete = async () => {
    try {
      await markComplete.mutateAsync({ courseId, lessonId });
      const nextPlayer = await refreshLearnData();
      maybeCelebrateCourseComplete(nextPlayer);
    } catch {
      toastManager.add({
        title: "Couldn't mark complete",
        description: "Check your connection and try again.",
        type: "error",
      });
    }
  };

  const onSubmitAssessment = async () => {
    if (!editor || !gate.allAttempted || gate.questionCount === 0 || assessmentCompleted) return;
    try {
      const result = await submitAssessment.mutateAsync({
        courseId,
        lessonId,
        answers: collectLessonQuestionAnswersForSubmit(editor.state),
      });
      const nextPlayer = await refreshLearnData();
      maybeCelebrateCourseComplete(nextPlayer);
      toastManager.add({
        title: "Lesson completed",
        description:
          result.maxScore > 0 ? `Score: ${result.score} / ${result.maxScore}.` : undefined,
        type: "success",
      });
    } catch {
      toastManager.add({
        title: "Couldn't submit assessment",
        description: "Check your connection and try again.",
        type: "error",
      });
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledToBottom = useScrolledToBottom(scrollRef);

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col [&:fullscreen]:bg-background"
      ref={examShellRef}
    >
      {examIntegrityEnabled ? (
        <div className="shrink-0 border-b bg-muted/35 px-3 py-2.5 md:px-5">
          {!examSessionStarted ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Fullscreen is recommended. Switching tabs or exiting fullscreen during the exam is
                recorded.
              </p>
              <Button
                className="shrink-0"
                onClick={() => void startExamSession()}
                size="sm"
                type="button"
              >
                Begin exam
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Stay on this tab until you submit. Leaving the exam may be flagged.
            </p>
          )}
        </div>
      ) : null}
      <div
        className={`relative min-h-0 flex-1 ${examIntegrityEnabled && !examSessionStarted ? "overflow-hidden" : ""}`}
      >
        <div
          className={`h-full min-h-0 overflow-y-auto px-3 py-4 md:px-5 ${examIntegrityEnabled && !examSessionStarted ? "pointer-events-none select-none" : ""}`}
          ref={scrollRef}
        >
          {lesson.sectionTitle ? (
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {lesson.sectionTitle}
            </p>
          ) : null}
          <h1 className="mb-4 text-2xl font-semibold tracking-tight md:text-3xl">{lesson.title}</h1>
          <QuestionTrackingProvider>
            <RichTextEditor
              className="border-0 bg-transparent"
              content={(lesson.content ?? null) as JSONContent | null}
              editable={false}
              learnQuestionLock={lesson.type === "article" ? "onCorrect" : "onAttempt"}
              mode="full"
              resolveMediaUrl={resolveMediaUrl}
              onCheckAnswer={async (args) => {
                const result = await trpcClient.learn.checkAnswer.mutate({
                  courseId,
                  lessonId,
                  questionId: args.questionId,
                  selected: args.selected,
                });
                queryClient.setQueryData(
                  trpc.learn.getLesson.queryKey({ courseId, lessonId }),
                  (prev) =>
                    prev
                      ? {
                          ...prev,
                          answers: {
                            ...prev.answers,
                            [args.questionId]: {
                              selected: args.selected,
                              isCorrect: result.isCorrect,
                            },
                          },
                        }
                      : prev,
                );
                return { isCorrect: result.isCorrect };
              }}
              onEditorReady={setEditor}
              showAdvancedChrome={false}
              variant="learn"
            />
          </QuestionTrackingProvider>
        </div>
        {examIntegrityEnabled && !examSessionStarted ? (
          <div
            aria-hidden
            className="pointer-events-auto absolute inset-0 z-10 flex cursor-default items-start justify-center bg-background/25 px-4 pt-16 backdrop-blur-md supports-backdrop-filter:bg-background/15 md:backdrop-blur-lg"
          >
            <p className="pointer-events-none max-w-sm rounded-md border border-border/80 bg-background/95 px-4 py-3 text-center text-sm shadow-lg">
              Tap <span className="font-medium">Begin exam</span> above to enter fullscreen and
              unlock the questions.
            </p>
          </div>
        ) : null}
      </div>
      <LearnFooter
        assessment={{
          completed: assessmentCompleted,
          editor,
          gate,
          submitting: submitAssessment.isPending,
          onSubmit: () => void onSubmitAssessment(),
        }}
        courseId={courseId}
        lesson={lesson}
        markComplete={{
          pending: markComplete.isPending,
          scrolledToBottom,
          onClick: () => void onMarkComplete(),
        }}
        nextLessonId={nextLessonId}
        prevLessonId={prevLessonId}
      />
    </div>
  );
}
