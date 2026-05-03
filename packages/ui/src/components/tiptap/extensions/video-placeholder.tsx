"use client";

import { Button } from "@sycom/components/ui/button";
import { FileUploader } from "@sycom/components/ui/file-uploader";
import { Input } from "@sycom/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sycom/components/ui/tabs";
import type { FileWithPreview } from "@sycom/hooks/use-file-upload";
import {
  NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
  isValidUrl,
  replaceNodeAtPosition,
} from "@sycom/lib/tiptap-utils";
import { useEditorEditable } from "@sycom/components/tiptap/use-editor-editable";
import {
  type CommandProps,
  Node,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import { Link, Upload, X } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { cn } from "@sycom/ui/lib/utils";

export interface VideoPlaceholderOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoPlaceholder: {
      insertVideoPlaceholder: () => ReturnType;
    };
  }
}

export const VideoPlaceholder = Node.create<VideoPlaceholderOptions>({
  name: "video-placeholder",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoPlaceholderComponent, {
      className: NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
    });
  },

  addCommands() {
    return {
      insertVideoPlaceholder: () => (props: CommandProps) => {
        return props.commands.insertContent({
          type: "video-placeholder",
        });
      },
    };
  },
});

function VideoPlaceholderComponent(props: NodeViewProps) {
  const { editor, selected, deleteNode, getPos } = props;
  const uploadInputId = useId();
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [pickedFile, setPickedFile] = useState<FileWithPreview | null>(null);

  const canEdit = useEditorEditable(editor);

  const insertVideo = (attrs: { src: string; poster: string | null; caption: string }) => {
    const pos = getPos();
    if (typeof pos !== "number") return;
    replaceNodeAtPosition(editor, pos, "video", {
      src: attrs.src,
      poster: attrs.poster,
      caption: attrs.caption,
      width: "100%",
      align: "center",
      aspectRatio: null,
    });
    setPickedFile(null);
    setUrl("");
    setPosterUrl("");
    setCaption("");
  };

  const handleInsertFromUpload = () => {
    if (!pickedFile?.preview) return;
    insertVideo({
      src: pickedFile.preview,
      poster: posterUrl.trim() && isValidUrl(posterUrl.trim()) ? posterUrl.trim() : null,
      caption: caption.trim(),
    });
  };

  const handleInsertFromUrl = (e: FormEvent) => {
    e.preventDefault();
    const valid = isValidUrl(url);
    if (!valid) {
      setUrlError(true);
      return;
    }
    if (url) {
      insertVideo({
        src: url,
        poster: posterUrl.trim() && isValidUrl(posterUrl.trim()) ? posterUrl.trim() : null,
        caption: caption.trim(),
      });
    }
  };

  return (
    <NodeViewWrapper className="flex w-full justify-center" data-drag-handle="">
      <div
        className={cn(
          "w-full max-w-md border p-2 shadow-sm",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Add video</h3>
          <Button type="button" variant="ghost" size="sm" onClick={deleteNode}>
            <X className="size-4" />
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v === "url" ? "url" : "upload")}
          className="w-full"
        >
          <TabsList className="isolate grid w-full grid-cols-2">
            <TabsTrigger
              value="upload"
              className="relative z-10 bg-transparent data-active:bg-background data-active:shadow-sm/5 dark:data-active:bg-input"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="url"
              className="relative z-10 bg-transparent data-active:bg-background data-active:shadow-sm/5 dark:data-active:bg-input"
            >
              <Link className="mr-2 h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-0">
            <div className="space-y-4 py-4">
              <FileUploader
                className="text-sm"
                accept="video/*"
                maxFileCount={1}
                multiple={false}
                disabled={!canEdit}
                inputId={uploadInputId}
                onFilesChange={(files) => setPickedFile(files[0] ?? null)}
              />
              <Input
                value={posterUrl}
                size="sm"
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="Poster URL (optional)"
              />
              <Input
                value={caption}
                size="sm"
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
              />
              <Button
                type="button"
                className="w-full"
                size="sm"
                disabled={!pickedFile?.preview || !canEdit}
                onClick={handleInsertFromUpload}
              >
                Insert video
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (urlError) setUrlError(false);
                  }}
                  placeholder="Video URL (https://...)"
                />
                {urlError && <p className="text-xs text-destructive">Please enter a valid URL</p>}
              </div>
              <Input
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="Poster URL (optional)"
              />
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
              />
              <Button
                type="button"
                onClick={handleInsertFromUrl}
                className="w-full"
                disabled={!url || !canEdit}
              >
                Insert video
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </NodeViewWrapper>
  );
}
