/**
 * LLM course generation using the Vercel AI SDK.
 *
 * Model routing is handled by AI SDK model IDs (for example `openai/gpt-4o-mini`)
 * and can run through Vercel AI Gateway when `AI_GATEWAY_API_KEY` is set.
 */
import { generateText, Output } from "ai";

import { env } from "@sycom/env/server";
import { TRPCError } from "@trpc/server";

import {
  generatedCourseTreeSchema,
  generatedCourseTreeRuntimeSchema,
  type GenerateCourseWithAIInput,
  type GeneratedCourseTreeModelOutput,
  type GeneratedCourseTreeOutput,
} from "../schemas";

function buildUserPrompt(input: GenerateCourseWithAIInput): string {
  const audience = input.audience?.trim() ? input.audience.trim() : "General learners";
  return `Create a complete course curriculum as structured JSON (schema: CourseTree).

Topic: ${input.topic}
Audience: ${audience}
Difficulty (set on the course): ${input.difficulty}

Structure (strict — counts must match exactly):
- Exactly ${input.sectionCount} sections in order (the "sections" array length).
- Each section must contain exactly ${input.lessonsPerSection} lessons.

Lesson types:
- includeQuizzes is ${input.includeQuizzes}.
- If false: every lesson "type" must be "article". Do not include "questions" on any lesson.
- If true: use mostly "article" lessons; include at least one "quiz" lesson per section (not every lesson). Optionally use "exam" for at most one lesson in the entire course if a formal assessment fits.
- Every "quiz" or "exam" lesson must include a "questions" array with at least one question. Each question needs 2–4 options and at least one isCorrect: true.

Content blocks ("blocks" on each lesson):
- Use "heading" (level 2 or 3), "paragraph", and "bullet" blocks to teach the topic.
- Article lessons should have substantive blocks (not empty). Quiz lessons should include a short "paragraph" or "heading" intro before questions are attached (questions are separate, not blocks).

Other rules:
- "slug": lowercase, hyphenated, 2–80 chars, no consecutive hyphens, URL-safe.
- "summaryBullets": 3–6 learner-facing outcome bullets.
- "description": 1–3 sentence course summary.
- Do not invent URLs, image links, or media file paths.
`;
}

export function assertGeneratedTreeMatchesRequest(
  tree: GeneratedCourseTreeOutput,
  input: GenerateCourseWithAIInput,
): void {
  if (tree.sections.length !== input.sectionCount) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `AI returned ${tree.sections.length} sections; expected ${input.sectionCount}. Try again.`,
    });
  }

  for (const section of tree.sections) {
    if (section.lessons.length !== input.lessonsPerSection) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `AI returned a section "${section.title}" with ${section.lessons.length} lessons; expected ${input.lessonsPerSection}. Try again.`,
      });
    }
  }

  for (const section of tree.sections) {
    for (const lessonRow of section.lessons) {
      if (!input.includeQuizzes && lessonRow.type !== "article") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "AI returned quizzes while quiz generation was disabled. Try again.",
        });
      }

      if (lessonRow.type === "quiz" || lessonRow.type === "exam") {
        const qs = lessonRow.questions ?? [];
        if (qs.length < 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `AI returned a ${lessonRow.type} without questions. Try again.`,
          });
        }
      }
    }
  }
}

function normalizeGeneratedTree(tree: GeneratedCourseTreeModelOutput): GeneratedCourseTreeOutput {
  const normalized = {
    title: tree.title,
    slug: tree.slug,
    description: tree.description ?? undefined,
    summaryBullets: tree.summaryBullets ?? undefined,
    sections: tree.sections.map((section) => ({
      title: section.title,
      description: section.description ?? undefined,
      lessons: section.lessons.map((lesson) => ({
        title: lesson.title,
        type: lesson.type,
        questions: lesson.questions ?? undefined,
        blocks: lesson.blocks.map((block) => {
          if (block.kind === "heading") {
            return {
              kind: "heading" as const,
              level: block.level,
              text: block.text,
            };
          }

          if (block.kind === "paragraph") {
            return {
              kind: "paragraph" as const,
              text: block.text,
            };
          }

          return {
            kind: "bullet" as const,
            items: block.items,
          };
        }),
      })),
    })),
  };

  const parsed = generatedCourseTreeRuntimeSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "AI returned an invalid course structure. Try again.",
      cause: parsed.error,
    });
  }

  return parsed.data;
}

export async function generateCourseTreeWithAi(input: GenerateCourseWithAIInput) {
  if (!env.AI_GATEWAY_API_KEY) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "AI course generation is not configured (missing AI_GATEWAY_API_KEY on the server).",
    });
  }

  const result = await generateText({
    model: "openai/gpt-5.4-nano",
    output: Output.object({
      schema: generatedCourseTreeSchema,
      name: "CourseTree",
      description:
        "Full LMS course: metadata, sections, lessons with text blocks and optional quiz questions",
    }),
    system:
      "You are an expert instructional designer. Return only data that satisfies the JSON schema. Be concise but pedagogically sound.",
    prompt: buildUserPrompt(input),
    temperature: 0.55,
  });

  return {
    object: normalizeGeneratedTree(result.output),
    usage: result.usage,
  };
}
