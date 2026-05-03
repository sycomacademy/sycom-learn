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
  Download,
  FileText,
  Image as ImageIcon,
  Music2,
  Trash,
  Video,
} from "lucide-react";

import { useEditorEditable } from "@sycom/components/tiptap/use-editor-editable";
import { Button, buttonVariants } from "@sycom/components/ui/button";
import { formatFileSize } from "@sycom/lib/tiptap-utils";
import { buildRawFileUrl } from "@sycom/ui/image/cdn";
import { cn } from "@sycom/ui/lib/utils";

export type FileAttachmentAttrs = {
  src: string | null;
  name: string;
  mimeType: string;
  size: number;
};

function FileGlyph({ mimeType }: { mimeType: string }) {
  const cls = "size-10 shrink-0 rounded-md border bg-muted p-2 text-muted-foreground";
  if (mimeType.startsWith("image/")) return <ImageIcon aria-hidden className={cls} />;
  if (mimeType.startsWith("video/")) return <Video aria-hidden className={cls} />;
  if (mimeType.startsWith("audio/")) return <Music2 aria-hidden className={cls} />;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("compressed") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar")
  ) {
    return <Archive aria-hidden className={cls} />;
  }
  return <FileText aria-hidden className={cls} />;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileAttachment: {
      insertFileAttachment: (attrs: Partial<FileAttachmentAttrs>) => ReturnType;
    };
  }
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
        "relative my-2 max-w-xl rounded-md border-2 border-transparent transition-all duration-200",
        selected ? "border-primary/50" : "",
      )}
      data-drag-handle=""
    >
      <div className="group relative overflow-hidden rounded-lg border bg-card p-3 shadow-sm">
        {canEdit || src ? (
          <div className="absolute top-4 right-4 flex items-center gap-1 rounded-md border bg-background/80 p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            {src ? (
              <a
                aria-label="Download file"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-7")}
                download={name}
                href={src ? buildRawFileUrl(src) : "#"}
              >
                <Download className="size-4" />
              </a>
            ) : null}
            {canEdit ? (
              <Button
                aria-label="Delete file"
                className="size-7 text-destructive"
                onClick={() => deleteNode()}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash className="size-4" />
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex min-w-0 items-center gap-3 pr-12">
          <FileGlyph mimeType={mimeType} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">
              {mimeType !== "application/octet-stream" ? mimeType : "File"} · {formatFileSize(size)}
            </p>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
