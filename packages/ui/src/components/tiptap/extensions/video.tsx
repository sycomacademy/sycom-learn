"use client";

import type { NodeViewProps } from "@tiptap/react";
import {
  type CommandProps,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import { Trash } from "lucide-react";
import { useState } from "react";

import { Button } from "@sycom/components/ui/button";
import { Input } from "@sycom/components/ui/input";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@sycom/ui/components/kibo-ui/video-player";
import { cn } from "@sycom/ui/lib/utils";

export type VideoAttrs = {
  src: string | null;
  poster: string | null;
  caption: string;
  width: string;
  align: "left" | "center" | "right";
  aspectRatio: number | null;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      insertVideo: (attrs: Partial<VideoAttrs>) => ReturnType;
    };
  }
}

export const VideoExtension = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
      caption: { default: "" },
      width: { default: "100%" },
      align: { default: "center" },
      aspectRatio: { default: null as number | null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-tiptap-video]",
      },
      {
        tag: "video[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const el = element as HTMLVideoElement;
          return {
            src: el.getAttribute("src"),
            poster: el.getAttribute("poster"),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const caption = ((node.attrs.caption as string) ?? "").trim();
    const videoSpec = [
      "video",
      {
        src: node.attrs.src ?? undefined,
        poster: node.attrs.poster ?? undefined,
        controls: true,
        preload: "metadata",
        style: `max-width:${node.attrs.width as string}`,
      },
    ] as const;
    if (caption) {
      return [
        "figure",
        mergeAttributes({ "data-tiptap-video": "" }, HTMLAttributes),
        videoSpec,
        ["figcaption", {}, caption],
      ];
    }
    return ["figure", mergeAttributes({ "data-tiptap-video": "" }, HTMLAttributes), videoSpec];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TiptapVideo);
  },

  addCommands() {
    return {
      insertVideo:
        (attrs) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src ?? null,
              poster: attrs.poster ?? null,
              caption: attrs.caption ?? "",
              width: attrs.width ?? "100%",
              align: attrs.align ?? "center",
              aspectRatio: attrs.aspectRatio ?? null,
            },
          });
        },
    };
  },
});

function TiptapVideo(props: NodeViewProps) {
  const { node, editor, selected, deleteNode, updateAttributes } = props;
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState((node.attrs.caption as string) || "");
  const canEdit = editor.isEditable;

  return (
    <NodeViewWrapper
      className={cn(
        "relative flex flex-col rounded-md border-2 border-transparent transition-all duration-200",
        selected ? "border-primary/50" : "",
        node.attrs.align === "left" && "mr-auto",
        node.attrs.align === "center" && "mx-auto",
        node.attrs.align === "right" && "ml-auto",
      )}
      style={{ width: node.attrs.width as string }}
    >
      <div className="group overflow-hidden rounded-lg border bg-card shadow-sm">
        <VideoPlayer className="w-full">
          <VideoPlayerContent
            src={node.attrs.src ?? undefined}
            poster={node.attrs.poster ?? undefined}
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                updateAttributes({
                  aspectRatio: video.videoWidth / video.videoHeight,
                });
              }
            }}
          />
          <VideoPlayerControlBar className="flex flex-wrap items-center gap-0 border-t bg-background/95">
            <VideoPlayerPlayButton />
            <VideoPlayerSeekBackwardButton />
            <VideoPlayerSeekForwardButton />
            <VideoPlayerTimeRange className="min-w-[120px] flex-1" />
            <VideoPlayerTimeDisplay showDuration />
            <VideoPlayerMuteButton />
            <VideoPlayerVolumeRange />
          </VideoPlayerControlBar>
        </VideoPlayer>

        {canEdit ? (
          editingCaption ? (
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onBlur={() => {
                updateAttributes({ caption });
                setEditingCaption(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateAttributes({ caption });
                  setEditingCaption(false);
                }
              }}
              className="rounded-none border-0 border-t text-center text-sm"
              placeholder="Add a caption..."
            />
          ) : (
            <button
              type="button"
              className="w-full cursor-text border-t py-2 text-center text-sm text-muted-foreground"
              onClick={() => setEditingCaption(true)}
            >
              {caption || "Add a caption..."}
            </button>
          )
        ) : caption ? (
          <p className="border-t py-2 text-center text-sm text-muted-foreground">{caption}</p>
        ) : null}

        {canEdit && (
          <div className="flex justify-end border-t p-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-destructive"
              aria-label="Delete video"
              onClick={() => deleteNode()}
            >
              <Trash className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
