import { uploadFile } from "@sycom/storage/client";
import type { JSONContent } from "@tiptap/core";
import { Button } from "@sycom/ui/components/button";
import { Collapsible, CollapsibleContent } from "@sycom/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
} from "@sycom/ui/components/elements/editable";
import { SortableItemHandle } from "@sycom/ui/components/elements/sortable";
import { Spinner } from "@sycom/ui/components/spinner";
import { cn } from "@sycom/ui/lib/utils";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  MoveRightIcon,
  Trash2Icon,
} from "lucide-react";
import { lazy, memo, Suspense, useCallback, useEffect, useState } from "react";

import { useTRPCClient } from "@/lib/trpc/client";

import {
  createEmptyLessonDocument,
  normalizeLessonContent,
  type CurriculumLesson,
  type CurriculumSection,
} from "./curriculum-schema";

const loadRichTextEditor = () =>
  import("@sycom/ui/components/tiptap/rich-text-editor").then((module) => ({
    default: module.RichTextEditor,
  }));

const LazyRichTextEditor = lazy(loadRichTextEditor);

function useLessonEditorUpload(lessonId: string) {
  const trpcClient = useTRPCClient();

  return useCallback(
    async (file: File) => {
      const signedParams = await trpcClient.storage.signUpload.mutate({
        folder: "lesson_artifacts",
        entityType: "lesson",
        entityId: lessonId,
      });

      const result = await uploadFile({ file, signedParams });

      await trpcClient.storage.saveAsset.mutate({
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        folder: "lesson_artifacts",
        entityType: "lesson",
        entityId: lessonId,
        resourceType: result.resourceType,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        name: file.name,
        tags: ["lesson-artifact"],
      });

      return { src: result.publicId };
    },
    [lessonId, trpcClient],
  );
}

type CurriculumLessonItemProps = {
  lesson: CurriculumLesson;
  expanded: boolean;
  moveTargets: CurriculumSection[];
  saving: boolean;
  onMoveToSection: (lessonId: string, sectionId: string) => void;
  onSaveContent: (lessonId: string, content: JSONContent | null) => Promise<void>;
  onToggleExpanded: (lessonId: string) => void;
  onUpdateTitle: (lessonId: string, title: string) => Promise<void>;
};

function CurriculumLessonItemImpl({
  lesson,
  expanded,
  moveTargets,
  saving,
  onMoveToSection,
  onSaveContent,
  onToggleExpanded,
  onUpdateTitle,
}: CurriculumLessonItemProps) {
  const onUpload = useLessonEditorUpload(lesson.id);
  const [content, setContent] = useState<JSONContent | null>(null);

  useEffect(() => {
    if (expanded) {
      setContent((current) => current ?? normalizeLessonContent(lesson.content));
    } else {
      setContent(normalizeLessonContent(lesson.content));
    }
  }, [expanded, lesson.content]);

  return (
    <Collapsible open={expanded}>
      <div className={cn("rounded-xl border bg-background", expanded && "ring-1 ring-primary/15")}>
        <div className="flex items-center gap-2 px-3 py-2">
          <SortableItemHandle className="shrink-0 touch-none text-muted-foreground hover:text-foreground">
            <GripVerticalIcon className="size-3.5" />
          </SortableItemHandle>

          <button
            aria-label={expanded ? "Collapse lesson" : "Expand lesson"}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            onFocus={() => void loadRichTextEditor()}
            onMouseEnter={() => void loadRichTextEditor()}
            onClick={() => onToggleExpanded(lesson.id)}
            type="button"
          >
            {expanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </button>

          <Editable
            className="min-w-0 flex-1"
            onSubmit={(value) => {
              const trimmedValue = value.trim();
              if (trimmedValue && trimmedValue !== lesson.title) {
                void onUpdateTitle(lesson.id, trimmedValue);
              }
            }}
            value={lesson.title}
          >
            <EditableArea className="w-full">
              <EditablePreview className="truncate text-sm font-medium hover:text-foreground" />
              <EditableInput className="h-8 w-full rounded-md border px-2 text-sm" />
            </EditableArea>
          </Editable>

          {moveTargets.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button aria-label="Move lesson to another section" size="sm" variant="ghost">
                    <MoveRightIcon className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                {moveTargets.map((section) => (
                  <DropdownMenuItem
                    key={section.id}
                    onClick={() => onMoveToSection(lesson.id, section.id)}
                  >
                    {section.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <Button
            aria-label="Delete lesson placeholder"
            disabled
            size="sm"
            title="Delete coming soon"
            variant="ghost"
          >
            <Trash2Icon className="size-4 text-muted-foreground" />
          </Button>
        </div>

        <CollapsibleContent>
          <div className="border-t py-3">
            <Suspense
              fallback={
                <div className="flex min-h-80 items-center justify-center rounded-xl border bg-card/40">
                  <Spinner className="size-5 text-muted-foreground" />
                </div>
              }
            >
              <LazyRichTextEditor
                className="border-0"
                content={content}
                mode="full"
                onChange={setContent}
                onUpload={onUpload}
                variant="embedded"
              />
            </Suspense>
            <div className="flex justify-end border-t p-3">
              <Button
                loading={saving}
                onClick={() =>
                  void onSaveContent(lesson.id, content ?? createEmptyLessonDocument())
                }
                size="sm"
              >
                Save lesson
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export const CurriculumLessonItem = memo(CurriculumLessonItemImpl);
