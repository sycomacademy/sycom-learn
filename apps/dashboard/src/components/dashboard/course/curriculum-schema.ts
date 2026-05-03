import type { AppRouterInputs, AppRouterOutputs } from "server/trpc/routers/_app";
import type { JSONContent } from "@tiptap/core";

export type CurriculumSection = AppRouterOutputs["course"]["getCurriculum"][number];
export type CurriculumLesson = CurriculumSection["lessons"][number];
export type CreateSectionInput = AppRouterInputs["course"]["createSection"];
export type CreateLessonInput = AppRouterInputs["lesson"]["create"];
export type UpdateLessonPatchInput = AppRouterInputs["lesson"]["update"]["patch"];

export function cloneCurriculumSections(sections: CurriculumSection[]): CurriculumSection[] {
  return sections.map((section) => ({
    ...section,
    lessons: section.lessons.map((lesson) => ({ ...lesson })),
  }));
}

export function normalizeLessonContent(content: CurriculumLesson["content"]): JSONContent | null {
  if (!content) return null;
  if (typeof content === "object" && content !== null && "type" in content) {
    return content as JSONContent;
  }
  if (Array.isArray(content) && content.length > 0) {
    return { type: "doc", content: content as JSONContent[] };
  }
  return null;
}

export function createEmptyLessonDocument(): JSONContent {
  return { type: "doc", content: [] };
}
