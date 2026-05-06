import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpenIcon } from "lucide-react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sycom/ui/components/card";
import { toastManager } from "@sycom/ui/components/toast";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";
import { useState } from "react";

export type CatalogEnrollCtaCardProps = {
  courseId: string;
  detail: AppRouterOutputs["catalog"]["get"];
};

export function CatalogEnrollCtaCard({ courseId, detail }: CatalogEnrollCtaCardProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useSuspenseQuery(trpc.profile.get.queryOptions());
  const [pending, setPending] = useState(false);

  const lessonCount = detail.sections.reduce((n, s) => n + s.lessons.length, 0);
  const isPlatformCourse = detail.organizationId == null;
  const isPublicStudent = profile.user.role === "public_student";
  const needsPaywall = isPlatformCourse && isPublicStudent;

  const primaryCtaLabel = needsPaywall ? "Get access" : "Enroll in course";

  const onEnroll = async () => {
    if (needsPaywall) {
      await navigate({ to: "/dashboard/catalog/$courseId/pay", params: { courseId } });
      return;
    }

    setPending(true);
    try {
      await trpcClient.catalog.enroll.mutate({ courseId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.catalog.get.queryKey({ courseId }) }),
        queryClient.invalidateQueries({ queryKey: trpc.catalog.list.queryKey() }),
      ]);

      toastManager.add({
        title: "You're enrolled",
        description: "You can start learning whenever you're ready.",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't reach server. Check your connection and try again.";

      toastManager.add({
        title: "Couldn't enroll",
        description: message,
        type: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="shrink-0 border bg-card shadow-xs/5 md:w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Ready to start?</CardTitle>
        <CardDescription>
          {needsPaywall
            ? "Purchase access to unlock the full course and start learning."
            : "Review the details, then jump into the course when you are ready."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {detail.enrolled ? (
          <Button className="w-full" render={<Link params={{ courseId }} to="/learn/$courseId" />}>
            Start learning
          </Button>
        ) : (
          <Button
            className="w-full"
            loading={pending}
            onClick={() => void onEnroll()}
            type="button"
          >
            {primaryCtaLabel}
          </Button>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
        <BookOpenIcon className="size-4 shrink-0" />
        <span>
          Lessons: {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
        </span>
      </CardFooter>
    </Card>
  );
}
