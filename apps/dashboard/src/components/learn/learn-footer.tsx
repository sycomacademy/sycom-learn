import { Link } from "@tanstack/react-router";
import type { Editor } from "@tiptap/core";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { type ReactElement, type ReactNode } from "react";

import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { Button } from "@sycom/ui/components/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@sycom/ui/components/tooltip";

type Lesson = AppRouterOutputs["learn"]["getLesson"];
type Gate = { allCorrect: boolean; allAttempted: boolean; questionCount: number };

export function LearnFooter({
  courseId,
  lesson,
  prevLessonId,
  nextLessonId,
  markComplete,
  assessment,
}: {
  courseId: string;
  lesson: Lesson;
  prevLessonId: string | undefined;
  nextLessonId: string | undefined;
  markComplete: { pending: boolean; scrolledToBottom: boolean; onClick: () => void };
  assessment: {
    completed: boolean;
    editor: Editor | null;
    gate: Gate;
    submitting: boolean;
    onSubmit: () => void;
  };
}) {
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-background px-4 py-3">
      <div className="flex flex-wrap gap-2">
        <NavButton
          courseId={courseId}
          direction="prev"
          icon={<ChevronLeftIcon />}
          lessonId={prevLessonId}
          label="Previous"
        />
        <NavButton
          courseId={courseId}
          direction="next"
          icon={<ChevronRightIcon />}
          lessonId={nextLessonId}
          label="Next"
        />
      </div>
      <CompletionAction assessment={assessment} lesson={lesson} markComplete={markComplete} />
    </footer>
  );
}

function NavButton({
  lessonId,
  courseId,
  direction,
  icon,
  label,
}: {
  lessonId: string | undefined;
  courseId: string;
  direction: "prev" | "next";
  icon: ReactNode;
  label: string;
}) {
  if (!lessonId) {
    return (
      <Button disabled size="sm" variant="outline">
        {direction === "prev" ? icon : null}
        {label}
        {direction === "next" ? icon : null}
      </Button>
    );
  }
  return (
    <Button
      render={
        <Link params={{ courseId, lessonId }} preload="intent" to="/learn/$courseId/$lessonId" />
      }
      size="sm"
      variant="outline"
    >
      {direction === "prev" ? icon : null}
      {label}
      {direction === "next" ? icon : null}
    </Button>
  );
}

function CompletionAction({
  lesson,
  markComplete,
  assessment,
}: {
  lesson: Lesson;
  markComplete: { pending: boolean; scrolledToBottom: boolean; onClick: () => void };
  assessment: {
    completed: boolean;
    editor: Editor | null;
    gate: Gate;
    submitting: boolean;
    onSubmit: () => void;
  };
}) {
  if (lesson.type === "article") {
    return <ArticleCompletionAction assessment={assessment} markComplete={markComplete} />;
  }
  if (lesson.type === "quiz" || lesson.type === "exam") {
    return <AssessmentCompletionAction assessment={assessment} />;
  }
  return (
    <p className="text-xs text-muted-foreground">
      Complete assessments from the lesson when available.
    </p>
  );
}

function ArticleCompletionAction({
  markComplete,
  assessment,
}: {
  markComplete: { pending: boolean; scrolledToBottom: boolean; onClick: () => void };
  assessment: { editor: Editor | null; gate: Gate };
}) {
  const hasQuestions = assessment.gate.questionCount > 0;
  if (hasQuestions && !assessment.gate.allCorrect) {
    return (
      <DisabledTooltip
        label="Mark complete"
        tooltip="Answer every question in this lesson correctly to mark it complete."
      />
    );
  }
  if (!markComplete.scrolledToBottom && !markComplete.pending) {
    return (
      <DisabledTooltip
        label="Mark complete"
        tooltip="Scroll to the bottom of this lesson before marking it complete."
      />
    );
  }
  return (
    <Button
      disabled={markComplete.pending}
      loading={markComplete.pending}
      onClick={markComplete.onClick}
      size="sm"
      variant="default"
    >
      Mark complete
    </Button>
  );
}

function AssessmentCompletionAction({
  assessment,
}: {
  assessment: {
    completed: boolean;
    editor: Editor | null;
    gate: Gate;
    submitting: boolean;
    onSubmit: () => void;
  };
}) {
  if (assessment.completed) {
    return (
      <Button disabled size="sm" variant="default">
        Completed
      </Button>
    );
  }
  if (!assessment.editor) {
    return (
      <Button className="max-w-[min(100%,22rem)] text-center" disabled size="sm" variant="default">
        Loading questions…
      </Button>
    );
  }
  if (assessment.gate.questionCount === 0) {
    return (
      <DisabledTooltip
        label="No questions in this lesson"
        tooltip="Add question blocks to this lesson to enable completion."
        variant="outline"
      />
    );
  }
  if (!assessment.gate.allAttempted) {
    return (
      <DisabledTooltip
        label="Mark complete"
        tooltip="Check every question in this assessment before marking it complete."
      />
    );
  }
  return (
    <Button
      disabled={assessment.submitting}
      loading={assessment.submitting}
      onClick={assessment.onSubmit}
      size="sm"
      variant="default"
    >
      Mark complete
    </Button>
  );
}

function DisabledTooltip({
  label,
  tooltip,
  variant = "default",
}: {
  label: string;
  tooltip: string;
  variant?: "default" | "outline";
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          (
            <span className="inline-flex max-w-[min(100%,22rem)] cursor-not-allowed">
              <Button className="text-center" disabled size="sm" variant={variant}>
                {label}
              </Button>
            </span>
          ) as ReactElement<Record<string, unknown>>
        }
      />
      <TooltipPopup side="top">{tooltip}</TooltipPopup>
    </Tooltip>
  );
}
