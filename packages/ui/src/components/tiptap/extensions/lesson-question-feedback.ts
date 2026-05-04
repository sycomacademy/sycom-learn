"use client";

import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";

import type { QuestionStatus } from "@sycom/components/tiptap/extensions/question-status";

export const lessonQuestionFeedbackKey = new PluginKey<Record<string, QuestionStatus>>(
  "lessonQuestionFeedback",
);

export type LessonQuestionResultMeta = {
  questionId: string;
  isCorrect: boolean;
};

export function collectQuestionIds(state: EditorState): string[] {
  const ids: string[] = [];
  state.doc.descendants((node) => {
    if (node.type.name === "question") {
      const id = node.attrs.questionId as string | undefined;
      if (id) ids.push(id);
    }
  });
  return ids;
}

export function getLessonQuestionFeedbackMap(state: EditorState): Record<string, QuestionStatus> {
  return lessonQuestionFeedbackKey.getState(state) ?? {};
}

export function getLessonQuestionGateSnapshot(editor: Editor): {
  statuses: Record<string, QuestionStatus>;
  questionCount: number;
  allCorrect: boolean;
  allAttempted: boolean;
} {
  const statuses = getLessonQuestionFeedbackMap(editor.state);
  const ids = collectQuestionIds(editor.state);
  const questionCount = ids.length;
  const allCorrect = questionCount === 0 || ids.every((id) => statuses[id] === "correct");
  const allAttempted =
    questionCount === 0 ||
    ids.every((id) => {
      const s = statuses[id];
      return s === "correct" || s === "incorrect";
    });
  return { statuses, questionCount, allCorrect, allAttempted };
}

export const LessonQuestionFeedback = Extension.create({
  name: "lessonQuestionFeedback",

  addCommands() {
    return {
      setLessonQuestionResult:
        ({ questionId, isCorrect }: LessonQuestionResultMeta) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(lessonQuestionFeedbackKey, { questionId, isCorrect });
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<Record<string, QuestionStatus>>({
        key: lessonQuestionFeedbackKey,
        state: {
          init: () => ({}),
          apply(tr, value) {
            const meta = tr.getMeta(lessonQuestionFeedbackKey) as
              | LessonQuestionResultMeta
              | undefined;
            if (meta?.questionId != null && typeof meta.isCorrect === "boolean") {
              return {
                ...value,
                [meta.questionId]: meta.isCorrect ? "correct" : "incorrect",
              };
            }
            return value;
          },
        },
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lessonQuestionFeedback: {
      setLessonQuestionResult: (args: LessonQuestionResultMeta) => ReturnType;
    };
  }
}
