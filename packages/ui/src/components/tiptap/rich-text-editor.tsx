"use client";
import "./tiptap.css";

import { getLightweightExtensions } from "@sycom/components/tiptap/extensions/preset-lightweight";
import {
  getFullExtensions,
  type GetFullExtensionsOptions,
} from "@sycom/components/tiptap/extensions/preset-full";
import { TipTapFloatingMenu } from "@sycom/components/tiptap/extensions/floating-menu";
import { FloatingToolbar } from "@sycom/components/tiptap/extensions/floating-toolbar";
import { TableBubbleMenu } from "@sycom/components/tiptap/extensions/table-bubble-menu";
import type { TiptapEditorUploadFn } from "@sycom/lib/tiptap-upload";
import { cn } from "@sycom/ui/lib/utils";
import { content as demoHtmlContent } from "@sycom/lib/content";
import type { FullPresetCheckAnswerFn } from "@sycom/components/tiptap/extensions/editor-preset-types";
import type { Content, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";

import { EditorToolbar } from "./toolbars/editor-toolbar";
import { LightweightEditorToolbar } from "./toolbars/lightweight-toolbar";

export type RichTextEditorProps = {
  mode: "lightweight" | "full";
  /** Initial / controlled document (HTML string or JSON). */
  content?: Content | null;
  editable?: boolean;
  onChange?: (json: JSONContent) => void;
  onUpload?: TiptapEditorUploadFn;
  onCheckAnswer?: FullPresetCheckAnswerFn;
  className?: string;
  contentClassName?: string;
  /** If true (default), full mode mounts slash menu + table bubble + floating toolbar. */
  showAdvancedChrome?: boolean;
};

export function RichTextEditor({
  mode,
  content = null,
  editable = true,
  onChange,
  onUpload,
  onCheckAnswer,
  className,
  contentClassName,
  showAdvancedChrome = true,
}: RichTextEditorProps) {
  const [viewOnly, setViewOnly] = useState(false);
  const editorEditable = editable && !viewOnly;

  useEffect(() => {
    if (!editable) setViewOnly(false);
  }, [editable]);

  const extensions = useMemo(() => {
    if (mode === "lightweight") {
      return getLightweightExtensions();
    }
    const opts: GetFullExtensionsOptions = {};
    if (onUpload) opts.onUpload = onUpload;
    if (onCheckAnswer) opts.onCheckAnswer = onCheckAnswer;
    return getFullExtensions(opts);
  }, [mode, onUpload, onCheckAnswer]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: content === null ? "" : (content ?? undefined),
    editable: editorEditable,
    editorProps: {
      attributes: {
        class: cn("max-w-full focus:outline-none", contentClassName),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editorEditable);
  }, [editor, editorEditable]);

  useEffect(() => {
    if (!editor || content === undefined) return;
    if (typeof content === "string") {
      if (editor.getHTML() === content) return;
      editor.commands.setContent(content, { emitUpdate: false });
      return;
    }
    const current = editor.getJSON();
    if (JSON.stringify(current) === JSON.stringify(content)) return;
    editor.commands.setContent(content ?? "", { emitUpdate: false });
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "relative max-h-[calc(100dvh-6rem)] w-full overflow-hidden overflow-y-scroll border bg-card pb-[60px] sm:pb-0",
        className,
      )}
    >
      {mode === "lightweight" ? (
        <LightweightEditorToolbar editor={editor} />
      ) : (
        <EditorToolbar
          editor={editor}
          viewOnlyToggle={editable ? { viewOnly, onViewOnlyChange: setViewOnly } : undefined}
        />
      )}
      {mode === "full" && showAdvancedChrome ? (
        <>
          <FloatingToolbar editor={editor} />
          <TableBubbleMenu editor={editor} />
          <TipTapFloatingMenu editor={editor} />
        </>
      ) : null}
      <EditorContent
        editor={editor}
        className="min-h-[600px] w-full min-w-full cursor-text sm:p-6"
      />
    </div>
  );
}

export function RichTextEditorDemo({ className }: { className?: string }) {
  return <RichTextEditor mode="full" content={demoHtmlContent} className={className} />;
}

export type { FullPresetCheckAnswerFn } from "@sycom/components/tiptap/extensions/editor-preset-types";
export {
  QuestionTrackingProvider,
  useQuestionGate,
} from "@sycom/components/tiptap/extensions/question-tracking";
