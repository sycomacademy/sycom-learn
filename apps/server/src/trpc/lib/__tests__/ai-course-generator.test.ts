import { describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";

import type { GenerateCourseWithAIInput, GeneratedCourseTreeOutput } from "../../schemas";
import { assertGeneratedTreeMatchesRequest } from "../ai-course-generator";

const baseInput: GenerateCourseWithAIInput = {
  topic: "Introduction to testing learning modules",
  difficulty: "beginner",
  sectionCount: 2,
  lessonsPerSection: 2,
  includeQuizzes: true,
};

function makeLesson(title: string, type: "article" | "quiz" | "exam", withQuestions: boolean) {
  return {
    title,
    type,
    blocks: [{ kind: "paragraph" as const, text: "Lesson body text." }],
    questions:
      withQuestions && type !== "article"
        ? [
            {
              prompt: "Pick one",
              type: "single" as const,
              options: [
                { text: "Correct", isCorrect: true },
                { text: "Wrong", isCorrect: false },
              ],
            },
          ]
        : undefined,
  };
}

describe("assertGeneratedTreeMatchesRequest", () => {
  test("accepts a tree that matches counts and quiz rules", () => {
    const tree: GeneratedCourseTreeOutput = {
      title: "Test Course",
      slug: "test-course",
      sections: [
        {
          title: "Section A",
          lessons: [
            makeLesson("Article one", "article", false),
            makeLesson("Quiz one", "quiz", true),
          ],
        },
        {
          title: "Section B",
          lessons: [
            makeLesson("Article two", "article", false),
            makeLesson("Quiz two", "quiz", true),
          ],
        },
      ],
    };

    expect(() => assertGeneratedTreeMatchesRequest(tree, baseInput)).not.toThrow();
  });

  test("throws when section count mismatches", () => {
    const tree: GeneratedCourseTreeOutput = {
      title: "Test Course",
      slug: "test-course",
      sections: [
        {
          title: "Only section",
          lessons: [
            makeLesson("Article one", "article", false),
            makeLesson("Quiz one", "quiz", true),
          ],
        },
      ],
    };

    expect(() => assertGeneratedTreeMatchesRequest(tree, baseInput)).toThrow(TRPCError);
  });

  test("throws when quizzes disabled but a quiz lesson appears", () => {
    const input: GenerateCourseWithAIInput = {
      ...baseInput,
      includeQuizzes: false,
    };
    const tree: GeneratedCourseTreeOutput = {
      title: "Test Course",
      slug: "test-course",
      sections: [
        {
          title: "Section A",
          lessons: [
            makeLesson("Article one", "article", false),
            makeLesson("Article two", "article", false),
          ],
        },
        {
          title: "Section B",
          lessons: [
            makeLesson("Article three", "article", false),
            makeLesson("Invalid quiz", "quiz", true),
          ],
        },
      ],
    };

    expect(() => assertGeneratedTreeMatchesRequest(tree, input)).toThrow(TRPCError);
  });
});
