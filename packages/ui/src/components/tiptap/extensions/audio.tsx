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
  AudioPlayer,
  AudioPlayerContent,
  AudioPlayerControlBar,
  AudioPlayerMuteButton,
  AudioPlayerPlayButton,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerVolumeRange,
} from "@sycom/ui/components/kibo-ui/audio-player";
import { cn } from "@sycom/ui/lib/utils";

export type AudioAttrs = {
  src: string | null;
  title: string;
  caption: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audio: {
      insertAudio: (attrs: Partial<AudioAttrs>) => ReturnType;
    };
  }
}

export const AudioExtension = Node.create({
  name: "audioBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: "" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-tiptap-audio]",
      },
      {
        tag: "audio[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const el = element as HTMLAudioElement;
          return {
            src: el.getAttribute("src"),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const caption = ((node.attrs.caption as string) ?? "").trim();
    const title = ((node.attrs.title as string) ?? "").trim();
    const audioSpec = [
      "audio",
      {
        src: node.attrs.src ?? undefined,
        controls: true,
        preload: "metadata",
        ...(title ? { title } : {}),
      },
    ] as const;
    if (caption) {
      return [
        "figure",
        mergeAttributes({ "data-tiptap-audio": "" }, HTMLAttributes),
        audioSpec,
        ["figcaption", {}, caption],
      ];
    }
    return ["figure", mergeAttributes({ "data-tiptap-audio": "" }, HTMLAttributes), audioSpec];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TiptapAudio);
  },

  addCommands() {
    return {
      insertAudio:
        (attrs) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src ?? null,
              title: attrs.title ?? "",
              caption: attrs.caption ?? "",
            },
          });
        },
    };
  },
});

function TiptapAudio(props: NodeViewProps) {
  const { node, editor, selected, deleteNode, updateAttributes } = props;
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState((node.attrs.caption as string) || "");
  const canEdit = useEditorEditable(editor);
  const title = (node.attrs.title as string) || "";

  return (
    <NodeViewWrapper
      className={cn(
        "relative flex max-w-xl flex-col rounded-md border-2 border-transparent transition-all duration-200",
        selected ? "border-primary/50" : "",
      )}
    >
      <div className="group overflow-hidden rounded-lg border bg-card shadow-sm">
        {title ? <p className="border-b px-3 py-2 text-sm font-medium">{title}</p> : null}
        <AudioPlayer className="w-full">
          <AudioPlayerContent src={node.attrs.src ?? undefined} preload="metadata" />
          <AudioPlayerControlBar className="flex flex-wrap items-center gap-0 border-t bg-background/95">
            <AudioPlayerPlayButton />
            <AudioPlayerSeekBackwardButton />
            <AudioPlayerSeekForwardButton />
            <AudioPlayerTimeRange className="min-w-[120px] flex-1" />
            <AudioPlayerTimeDisplay showDuration />
            <AudioPlayerMuteButton />
            <AudioPlayerVolumeRange />
          </AudioPlayerControlBar>
        </AudioPlayer>

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
              aria-label="Delete audio"
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
