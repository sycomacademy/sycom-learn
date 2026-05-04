import { countQuestionBlocksInContent } from "@sycom/db/queries/lesson";
import type { LessonType } from "@sycom/db/schema/course";
import readingTime from "reading-time";

const QUIZ_MIN_PER_QUESTION = 1.5;

function extractPlainTextFromContent(doc: unknown): string {
  if (doc == null) {
    return "";
  }
  if (typeof doc === "string") {
    return doc;
  }
  if (Array.isArray(doc)) {
    return doc.map(extractPlainTextFromContent).filter(Boolean).join(" ");
  }
  if (typeof doc !== "object") {
    return "";
  }

  const node = doc as Record<string, unknown>;
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }
  if (Array.isArray(node.content)) {
    return node.content.map(extractPlainTextFromContent).filter(Boolean).join(" ");
  }
  return "";
}

export function estimateLessonMinutes(input: { type: LessonType; content: unknown }): number {
  const text = extractPlainTextFromContent(input.content);
  const proseMins = readingTime(text).minutes;
  if (input.type === "article") {
    return Math.max(1, Math.round(proseMins));
  }
  const questions = countQuestionBlocksInContent(input.content);
  return Math.max(1, Math.round(proseMins + questions * QUIZ_MIN_PER_QUESTION));
}
