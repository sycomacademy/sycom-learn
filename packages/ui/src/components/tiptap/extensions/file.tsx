"use client";

import type { NodeViewProps } from "@tiptap/react";
import {
  type CommandProps,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import {
  Archive,
  FileText,
  Image as ImageIcon,
  Music2,
  Trash,
  Video,
  Download,
} from "lucide-react";

import { useEditorEditable } from "@sycom/components/tiptap/use-editor-editable";
import { Button, buttonVariants } from "@sycom/components/ui/button";
import { formatFileSize } from "@sycom/lib/tiptap-utils";
import { cn } from "@sycom/ui/lib/utils";

export type FileAttachmentAttrs = {
  src: string | null;
  name: string;
  mimeType: string;
  size: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileAttachment: {
      insertFileAttachment: (attrs: Partial<FileAttachmentAttrs>) => ReturnType;
    };
  }
}

function FileGlyph({ mimeType }: { mimeType: string }) {
  const cls = "size-10 shrink-0 rounded-md border bg-muted p-2 text-muted-foreground";
  if (mimeType.startsWith("image/")) return <ImageIcon className={cls} aria-hidden />;
  if (mimeType.startsWith("video/")) return <Video className={cls} aria-hidden />;
  if (mimeType.startsWith("audio/")) return <Music2 className={cls} aria-hidden />;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("compressed") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar")
  ) {
    return <Archive className={cls} aria-hidden />;
  }
  return <FileText className={cls} aria-hidden />;
}

export const FileAttachment = Node.create({
  name: "fileAttachment",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      name: { default: "file" },
      mimeType: { default: "application/octet-stream" },
      size: { default: 0 },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-tiptap-file]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const el = element as HTMLElement;
          const sizeRaw = el.getAttribute("data-size");
          return {
            src: el.getAttribute("data-src"),
            name: el.getAttribute("data-name") ?? "file",
            mimeType: el.getAttribute("data-mime") ?? "application/octet-stream",
            size: sizeRaw ? Number(sizeRaw) : 0,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        {
          "data-tiptap-file": "",
          "data-src": node.attrs.src ?? "",
          "data-name": node.attrs.name as string,
          "data-mime": node.attrs.mimeType as string,
          "data-size": String(node.attrs.size as number),
        },
        HTMLAttributes,
      ),
      [
        "a",
        {
          href: node.attrs.src ?? "#",
          download: node.attrs.name as string,
        },
        node.attrs.name as string,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TiptapFileAttachment);
  },

  addCommands() {
    return {
      insertFileAttachment:
        (attrs) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src ?? null,
              name: attrs.name ?? "file",
              mimeType: attrs.mimeType ?? "application/octet-stream",
              size: attrs.size ?? 0,
            },
          });
        },
    };
  },
});

function TiptapFileAttachment(props: NodeViewProps) {
  const { node, editor, selected, deleteNode } = props;
  const canEdit = useEditorEditable(editor);
  const src = node.attrs.src as string | null;
  const name = (node.attrs.name as string) || "file";
  const mimeType = (node.attrs.mimeType as string) || "application/octet-stream";
  const size = Number(node.attrs.size) || 0;

  return (
    <NodeViewWrapper
      className={cn(
        "my-2 flex max-w-xl rounded-lg border bg-card p-3 shadow-sm",
        selected ? "ring-2 ring-primary/50" : "",
      )}
      data-drag-handle=""
    >
      <FileGlyph mimeType={mimeType} />
      <div className="min-w-0 flex-1 pl-3">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          {mimeType !== "application/octet-stream" ? mimeType : "File"} · {formatFileSize(size)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {src ? (
            <a
              href={src}
              download={name}
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "inline-flex h-8 items-center gap-2",
              )}
            >
              <Download className="size-4" />
              Download
            </a>
          ) : null}
          {canEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-destructive"
              onClick={() => deleteNode()}
            >
              <Trash className="size-4" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
