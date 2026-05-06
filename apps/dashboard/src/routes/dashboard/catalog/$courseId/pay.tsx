import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";

import { useTRPC, useTRPCClient } from "@/lib/trpc/client";
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

export const Route = createFileRoute("/dashboard/catalog/$courseId/pay")({
  head: () => ({
    meta: [{ title: "Get access | Course catalog | Sycom LMS" }],
  }),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.catalog.get.queryOptions({ courseId: params.courseId }),
      ),
      context.queryClient.ensureQueryData(context.trpc.profile.get.queryOptions()),
    ]);

    const course = context.queryClient.getQueryData(
      context.trpc.catalog.get.queryKey({ courseId: params.courseId }),
    );
    if (course?.enrolled) {
      throw redirect({
        to: "/learn/$courseId",
        params: { courseId: params.courseId },
      });
    }
    if (course?.organizationId != null) {
      throw redirect({
        to: "/dashboard/catalog/$courseId/",
        params: { courseId: params.courseId },
      });
    }
  },
  component: CatalogCoursePayPage,
});

function CatalogCoursePayPage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { data: course } = useSuspenseQuery(trpc.catalog.get.queryOptions({ courseId }));
  const { data: profile } = useSuspenseQuery(trpc.profile.get.queryOptions());
  const [grantPending, setGrantPending] = useState(false);

  const impersonating = Boolean(profile.session.impersonatedBy);

  const onGrantAccess = async () => {
    setGrantPending(true);
    try {
      await trpcClient.catalog.grantAccessAsImpersonator.mutate({ courseId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.catalog.get.queryKey({ courseId }) }),
        queryClient.invalidateQueries({ queryKey: trpc.catalog.list.queryKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.student.getLibrary.queryKey({}) }),
      ]);
      toastManager.add({
        title: "Access granted",
        description: "You can start learning now.",
        type: "success",
      });
      await navigate({ to: "/learn/$courseId", params: { courseId } });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't reach server. Check your connection and try again.";
      toastManager.add({
        title: "Couldn't grant access",
        description: message,
        type: "error",
      });
    } finally {
      setGrantPending(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-8">
      <div>
        <Button
          className="-ml-2 text-muted-foreground hover:text-foreground"
          render={
            <Link params={{ courseId }} to="/dashboard/catalog/$courseId/" preload="intent" />
          }
          size="xs"
          variant="ghost"
        >
          <ArrowLeftIcon />
          Back to course
        </Button>
      </div>

      <Card className="border bg-card shadow-xs/5">
        <CardHeader>
          <CardTitle className="text-xl">Get access</CardTitle>
          <CardDescription>
            Unlock <span className="font-medium text-foreground">{course.title}</span> to start
            learning. Checkout will be available soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Stripe checkout is coming next.</p>
          </div>
          <Button className="w-full" disabled type="button" variant="secondary">
            Pay with card
          </Button>
        </CardContent>
        {impersonating ? (
          <CardFooter className="flex flex-col items-stretch gap-3 border-t pt-6">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-foreground">Admin override</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You are impersonating this learner. Grant access without payment for testing.
              </p>
              <Button
                className="mt-4 w-full"
                loading={grantPending}
                onClick={() => void onGrantAccess()}
                type="button"
              >
                Grant access
              </Button>
            </div>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}
