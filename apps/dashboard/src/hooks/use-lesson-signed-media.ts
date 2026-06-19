import { useQuery } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/core";
import { useCallback, useMemo } from "react";

import type { ResolveMediaUrl } from "@sycom/ui/components/tiptap/signed-media-url-context";
import { collectLessonMediaRefs, makeSignedMediaUrlKey } from "@sycom/ui/lib/lesson-media";

import { useTRPC } from "@/lib/trpc/client";

const SIGNED_MEDIA_STALE_MS = 4 * 60 * 1000;

/** Batch-fetch signed Cloudinary URLs for lesson TipTap content. */
export function useLessonSignedMediaResolver(
  content: JSONContent | null | undefined,
): ResolveMediaUrl | undefined {
  const trpc = useTRPC();
  const items = useMemo(() => collectLessonMediaRefs(content), [content]);

  const queryInput = useMemo(
    () => ({
      items: items.map((item) => ({
        publicId: item.publicId,
        resourceType: item.resourceType,
        format: item.format ?? undefined,
        download: item.download,
      })),
      expireIn: 300,
    }),
    [items],
  );

  const { data } = useQuery({
    ...trpc.storage.getSignedMediaUrls.queryOptions(queryInput),
    enabled: items.length > 0,
    staleTime: SIGNED_MEDIA_STALE_MS,
    refetchInterval: SIGNED_MEDIA_STALE_MS,
  });

  return useCallback(
    (input) => {
      if (!input.publicId) return undefined;
      return data?.urls[makeSignedMediaUrlKey(input.publicId, input.download)];
    },
    [data],
  );
}
