import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { uploadFile } from "@sycom/storage/client";
import type { JSONContent } from "@tiptap/core";
import { Button } from "@sycom/ui/components/button";
import { Card, CardPanel, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { RichTextEditor } from "@sycom/ui/components/tiptap/rich-text-editor";
import { toastManager } from "@sycom/ui/components/toast";

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

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        lessonId,
        patch: { content },
      });
      await queryClient.invalidateQueries({ queryKey: trpc.lesson.get.queryKey({ lessonId }) });
      toastManager.add({
        type: "success",
        title: "Lesson saved",
        description: "Content has been updated.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't save lesson. Try again.";
      toastManager.add({
        type: "error",
        title: "Save failed",
        description: message,
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          render={<Link params={{ courseId }} to="/dashboard/course/$courseId/curriculum/" />}
        >
          Back to curriculum
        </Button>
        <Button loading={updateMutation.isPending} onClick={() => void handleSave()} type="button">
          Save lesson
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{lesson.title}</CardTitle>
          <CardDescription>
            Author lesson content. Media uploads go to lesson artifacts.
          </CardDescription>
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
