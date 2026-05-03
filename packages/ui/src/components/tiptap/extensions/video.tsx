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

import { useEditorEditable } from "@sycom/components/tiptap/use-editor-editable";
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

function getYouTubeEmbedUrl(url: string | null | undefined) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
    }

    if (hostname === "youtube-nocookie.com") {
      if (parsedUrl.pathname.startsWith("/embed/")) {
        const videoId = parsedUrl.pathname.split("/")[2];
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
      }
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        const videoId = parsedUrl.searchParams.get("v");
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        const videoId = parsedUrl.pathname.split("/")[2];
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
      }

      if (parsedUrl.pathname.startsWith("/shorts/")) {
        const videoId = parsedUrl.pathname.split("/")[2];
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export type VideoAttrs = {
  src: string | null;
  poster: string | null;
  title: string;
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
      title: { default: "" },
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
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const figure = element as HTMLElement;
          const video = figure.querySelector("video");
          const iframe = figure.querySelector("iframe");
          const caption = figure.querySelector("figcaption")?.textContent?.trim() ?? "";

          if (video) {
            return {
              src: video.getAttribute("src"),
              poster: video.getAttribute("poster"),
              title: video.getAttribute("title") ?? "",
              caption,
            };
          }

          if (iframe) {
            return {
              src: iframe.getAttribute("src"),
              poster: null,
              title: iframe.getAttribute("title") ?? "",
              caption,
              aspectRatio: 16 / 9,
            };
          }

          return false;
        },
      },
      {
        tag: "video[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const el = element as HTMLVideoElement;
          const caption =
            el.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ?? "";

          return {
            src: el.getAttribute("src"),
            poster: el.getAttribute("poster"),
            title: el.getAttribute("title") ?? "",
            caption,
          };
        },
      },
      {
        tag: "iframe[src*='youtube.com'], iframe[src*='youtube-nocookie.com']",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const el = element as HTMLIFrameElement;
          const caption =
            el.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ?? "";

          return {
            src: el.getAttribute("src"),
            poster: null,
            title: el.getAttribute("title") ?? "",
            caption,
            aspectRatio: 16 / 9,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const caption = ((node.attrs.caption as string) ?? "").trim();
    const title = ((node.attrs.title as string) ?? "").trim();
    const embedUrl = getYouTubeEmbedUrl(node.attrs.src as string | null | undefined);
    const videoSpec = embedUrl
      ? ([
          "iframe",
          {
            src: embedUrl,
            title: title || "YouTube video",
            allow:
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
            allowfullscreen: "true",
            referrerpolicy: "strict-origin-when-cross-origin",
            style: `width:100%;aspect-ratio:${String(node.attrs.aspectRatio ?? 16 / 9)};`,
          },
        ] as const)
      : ([
          "video",
          {
            src: node.attrs.src ?? undefined,
            poster: node.attrs.poster ?? undefined,
            controls: true,
            preload: "metadata",
            style: `max-width:${node.attrs.width as string}`,
            ...(title ? { title } : {}),
          },
        ] as const);
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
              title: attrs.title ?? "",
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
  const canEdit = useEditorEditable(editor);
  const title = (node.attrs.title as string) || "";
  const src = node.attrs.src as string | null;
  const embedUrl = getYouTubeEmbedUrl(src);
  const aspectRatio = Number(node.attrs.aspectRatio) || 16 / 9;

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
        <div className="flex items-center justify-between p-2 px-4">
          <p className="text-sm font-medium">{title ? title : "Video"}</p>
          {canEdit ? (
            <Button
              aria-label="Delete video"
              className="h-8 text-destructive"
              onClick={() => deleteNode()}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Trash className="size-4" />
            </Button>
          ) : null}
        </div>
        {embedUrl ? (
          <div className="border-t bg-black">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              aria-label={title || "YouTube video"}
              className="w-full"
              referrerPolicy="strict-origin-when-cross-origin"
              src={embedUrl}
              style={{ aspectRatio: String(aspectRatio) }}
              title="YouTube video player"
            />
          </div>
        ) : (
          <VideoPlayer className="w-full">
            <VideoPlayerContent
              src={src ?? undefined}
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
        )}

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
      </div>
    </NodeViewWrapper>
  );
}
