import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/core";
import { Button } from "@sycom/ui/components/button";
import { Card, CardPanel, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import {
  QuestionTrackingProvider,
  RichTextEditor,
  useQuestionGate,
} from "@sycom/ui/components/tiptap/rich-text-editor";

import { useTRPC, useTRPCClient } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/course/$courseId/curriculum/$lessonId/view")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.lesson.get.queryOptions({ lessonId: params.lessonId }),
    );
  },
  component: LessonViewPage,
});

function ContinueBar({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const trpc = useTRPC();
  const { data: lessons } = useSuspenseQuery(trpc.lesson.listByCourse.queryOptions({ courseId }));
  const { allCorrect, questionCount } = useQuestionGate();

  const idx = lessons.findIndex((l) => l.id === lessonId);
  const next = idx >= 0 ? lessons[idx + 1] : undefined;
  const gated = questionCount > 0 && !allCorrect;

  if (!next) {
    return (
      <p className="text-sm text-muted-foreground">This is the last lesson in the curriculum.</p>
    );
  }

  return (
    <Button
      disabled={gated}
      render={
        <Link
          params={{ courseId, lessonId: next.id }}
          to="/dashboard/course/$courseId/curriculum/$lessonId/view"
        />
      }
    >
      Next lesson
    </Button>
  );
}

function LessonViewPage() {
  const { courseId, lessonId } = Route.useParams();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { data: lesson } = useSuspenseQuery(trpc.lesson.get.queryOptions({ lessonId }));

  return (
    <div className="space-y-4">
      <Button render={<Link params={{ courseId }} to="/dashboard/course/$courseId/curriculum/" />}>
        Back to curriculum
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{lesson.title}</CardTitle>
          <CardDescription>
            Learner preview. Question blocks require correct answers to continue.
          </CardDescription>
        </CardHeader>
        <CardPanel className="space-y-4 p-0">
          <QuestionTrackingProvider>
            <RichTextEditor
              className="border-0"
              content={(lesson.content ?? null) as JSONContent | null}
              editable={false}
              mode="full"
              onCheckAnswer={async (args: { questionId: string; selected: string[] }) => {
                const result = await trpcClient.lesson.checkAnswer.mutate({
                  lessonId,
                  questionId: args.questionId,
                  selected: args.selected,
                });
                return { isCorrect: result.isCorrect };
              }}
              showAdvancedChrome={false}
            />
            <div className="flex justify-end border-t px-4 py-3">
              <ContinueBar courseId={courseId} lessonId={lessonId} />
            </div>
          </QuestionTrackingProvider>
        </CardPanel>
      </Card>
    </div>
  );
}
