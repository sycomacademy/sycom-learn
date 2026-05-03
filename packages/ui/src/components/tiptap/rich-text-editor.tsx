"use client";
import "./tiptap.css";

import { cn } from "@sycom/ui/lib/utils";
import { ImageExtension } from "@sycom/components/tiptap/extensions/image";
import { ImagePlaceholder } from "@sycom/components/tiptap/extensions/image-placeholder";
import { VideoExtension } from "@sycom/components/tiptap/extensions/video";
import { VideoPlaceholder } from "@sycom/components/tiptap/extensions/video-placeholder";
import { AudioExtension } from "@sycom/components/tiptap/extensions/audio";
import { AudioPlaceholder } from "@sycom/components/tiptap/extensions/audio-placeholder";
import { FileAttachment } from "@sycom/components/tiptap/extensions/file";
import { FilePlaceholder } from "@sycom/components/tiptap/extensions/file-placeholder";
import SearchAndReplace from "@sycom/components/tiptap/extensions/search-and-replace";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, type Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { TipTapFloatingMenu } from "@sycom/components/tiptap/extensions/floating-menu";
import { FloatingToolbar } from "@sycom/components/tiptap/extensions/floating-toolbar";
import { TableBubbleMenu } from "@sycom/components/tiptap/extensions/table-bubble-menu";
import { TableExtension } from "@sycom/components/tiptap/extensions/table";
import Placeholder from "@tiptap/extension-placeholder";
import { content } from "@sycom/lib/content";

import { EditorToolbar } from "./toolbars/editor-toolbar";

const lowlight = createLowlight(common);

const extensions = [
  StarterKit.configure({
    codeBlock: false,
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal",
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: "list-disc",
      },
    },
    heading: {
      levels: [1, 2, 3, 4],
    },
  }),
  CodeBlockLowlight.configure({ lowlight }),
  Placeholder.configure({
    emptyNodeClass: "is-editor-empty",
    placeholder: ({ node }) => {
      switch (node.type.name) {
        case "heading":
          return `Heading ${node.attrs.level}`;
        case "detailsSummary":
          return "Section title";
        case "codeBlock":
          // never show the placeholder when editing code
          return "";
        default:
          return "Write, type '/' for commands";
      }
    },
    includeChildren: false,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TextStyle,
  Subscript,
  Superscript,
  Underline,
  Link,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  ImageExtension,
  ImagePlaceholder,
  VideoExtension,
  VideoPlaceholder,
  AudioExtension,
  AudioPlaceholder,
  FileAttachment,
  FilePlaceholder,
  TableExtension,
  SearchAndReplace,
  Typography,
  Markdown.configure({
    markedOptions: { gfm: true },
  }),
];

export function RichTextEditorDemo({ className }: { className?: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: extensions as Extension[],
    content,
    editorProps: {
      attributes: {
        class: "max-w-full focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      // do what you want to do with output
      // Update stats
      // saving as text/json/hmtml
      // const text = editor.getHTML();
      console.log(editor.getText());
    },
  });

  if (!editor) return null;

  return (
    <div
      className={cn(
        "relative max-h-[calc(100dvh-6rem)] w-full overflow-hidden overflow-y-scroll border bg-card pb-[60px] sm:pb-0",
        className,
      )}
    >
      <EditorToolbar editor={editor} />
      <FloatingToolbar editor={editor} />
      <TableBubbleMenu editor={editor} />
      <TipTapFloatingMenu editor={editor} />
      <EditorContent
        editor={editor}
        className="min-h-[600px] w-full min-w-full cursor-text sm:p-6"
      />
    </div>
  );
}
