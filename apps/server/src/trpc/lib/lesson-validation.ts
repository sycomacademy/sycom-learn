import { TRPCError } from "@trpc/server";
import type { LessonType } from "@sycom/db/schema/course";
import { countQuestionBlocksInContent } from "@sycom/db/queries/index";

export function assertValidLessonConfiguration(input: {
  type: LessonType;
  content: unknown;
  openAt: Date | null;
  dueAt: Date | null;
}) {
  const questionCount = countQuestionBlocksInContent(input.content);

  if ((input.type === "quiz" || input.type === "exam") && questionCount < 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${input.type === "quiz" ? "Quiz" : "Exam"} lessons must include at least one question block`,
    });
  }

  if (input.type === "exam") {
    if (!input.openAt || !input.dueAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Exam lessons must include both an open date and a due date",
      });
    }

    if (input.openAt >= input.dueAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Exam open date must be before the due date",
      });
    }
  }
}
