import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { uploadFile } from "@sycom/storage/client";
import { MEDIA_LIMITS, resourceKindFromMime } from "@sycom/storage/limits";
import type { JSONContent } from "@tiptap/core";
import { Button } from "@sycom/ui/components/button";
import { Card, CardPanel, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { RichTextEditor } from "@sycom/ui/components/tiptap/rich-text-editor";
import { toastManager } from "@sycom/ui/components/toast";

import { AutoSaveStatus } from "@/components/dashboard/course/auto-save-status";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/course/$courseId/curriculum/$lessonId/edit")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.lesson.get.queryOptions({ lessonId: params.lessonId }),
    );
  },
  component: LessonEditPage,
});

function useEditorUpload(lessonId: string) {
  const trpcClient = useTRPCClient();
  return useCallback(
    async (file: File) => {
      const resourceType = resourceKindFromMime(file.type);
      if (file.size > MEDIA_LIMITS[resourceType]) {
        const limitMb = Math.round(MEDIA_LIMITS[resourceType] / (1024 * 1024));
        toastManager.add({
          title: "File too large",
          description: `This ${resourceType} exceeds the ${limitMb} MB limit.`,
          type: "error",
        });
        throw new Error(`File exceeds the ${limitMb} MB ${resourceType} limit`);
      }

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

function LessonEditPage() {
  const { courseId, lessonId } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: lesson } = useSuspenseQuery(trpc.lesson.get.queryOptions({ lessonId }));
  const onUpload = useEditorUpload(lessonId);

  const [content, setContent] = useState<JSONContent | null>(
    () => (lesson.content ?? null) as JSONContent | null,
  );

  useEffect(() => {
    setContent((lesson.content ?? null) as JSONContent | null);
  }, [lessonId, lesson.content, lesson.updatedAt]);

  const updateMutation = useMutation(trpc.lesson.update.mutationOptions());

  const saveContent = useCallback(
    async ({ silent }: { silent: boolean }) => {
      try {
        await updateMutation.mutateAsync({
          lessonId,
          patch: { content },
        });
        await queryClient.invalidateQueries({ queryKey: trpc.lesson.get.queryKey({ lessonId }) });
        if (!silent) {
          toastManager.add({
            type: "success",
            title: "Lesson saved",
            description: "Content has been updated.",
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Couldn't save lesson. Try again.";
        toastManager.add({
          type: "error",
          title: "Save failed",
          description: message,
        });
        throw error;
      }
    },
    [content, lessonId, queryClient, trpc, updateMutation],
  );

  const autoSave = useAutoSave({
    baselineResetKey: lessonId,
    data: content,
    onSave: saveContent,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          render={<Link params={{ courseId }} to="/dashboard/course/$courseId/curriculum/" />}
        >
          Back to curriculum
        </Button>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <AutoSaveStatus lastSavedAt={autoSave.lastSavedAt} status={autoSave.status} />
          <Button
            loading={updateMutation.isPending}
            onClick={() => void autoSave.save()}
            type="button"
          >
            Save lesson
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{lesson.title}</CardTitle>
        </CardHeader>
        <CardPanel className="p-0">
          <RichTextEditor
            className="border-0"
            content={content ?? null}
            mode="full"
            onChange={setContent}
            onUpload={onUpload}
          />
        </CardPanel>
      </Card>
    </div>
  );
}
